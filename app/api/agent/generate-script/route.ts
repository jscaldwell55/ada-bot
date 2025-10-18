/**
 * Action Agent - Script Adaptation API Route
 * POST /api/agent/generate-script - Generate adaptive regulation scripts
 */

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { actionAgentScriptInputSchema, actionAgentScriptOutputSchema } from '@/lib/validation/schemas'
import { ACTION_AGENT_SCRIPT_SYSTEM_PROMPT, AGENT_MODEL_CONFIG, FALLBACK_MESSAGES } from '@/lib/agents/prompts'
import { validateScriptOutput, checkForPseudoscience } from '@/lib/services/agentSafety'
import { callOpenAIWithTimeout, AGENT_TIMEOUTS, OpenAITimeoutError } from '@/lib/agents/openai-client'
import { logAgentAction, logFallback, logSafetyCheck } from '@/lib/services/agentLogger'
import type { ActionAgentScriptOutput } from '@/types/agents'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Log request started
    logAgentAction('Script Adaptation Request Started', { timestamp: new Date().toISOString() })

    // Parse and validate request body
    const body = await request.json()
    const validatedInput = actionAgentScriptInputSchema.parse(body)

    // 2. Log input validation
    logAgentAction('Script Adaptation Input Validated', {
      roundNumber: validatedInput.round_number,
      emotion: validatedInput.labeled_emotion,
      intensity: validatedInput.pre_intensity,
      hasObserverInsights: !!validatedInput.observer_insights,
    })

    const supabase = createClient()

    // Fetch child details
    const { data: child, error: childError } = await supabase
      .from('children')
      .select('age_band, nickname')
      .eq('id', validatedInput.child_id)
      .single()

    if (childError || !child) {
      return NextResponse.json({
        success: false,
        error: 'not_found',
        message: 'Child not found',
      }, { status: 404 })
    }

    // Store child data with explicit typing to help TypeScript
    const childData: { age_band: string; nickname: string } = child

    // Fetch base regulation scripts for reference
    const { data: baseScripts } = await supabase
      .from('regulation_scripts')
      .select('*')
      .contains('recommended_for_emotions', [validatedInput.labeled_emotion])
      .limit(3)

    // Build context for script generation
    const userPrompt = JSON.stringify({
      child_profile: {
        age_band: childData.age_band,
        round_number: validatedInput.round_number,
      },
      current_state: {
        labeled_emotion: validatedInput.labeled_emotion,
        pre_intensity: validatedInput.pre_intensity,
      },
      observer_insights: validatedInput.observer_insights ? {
        regulation_effectiveness: validatedInput.observer_insights.regulation_effectiveness,
        contextual_insights: validatedInput.observer_insights.contextual_insights,
      } : null,
      effective_scripts_history: validatedInput.effective_scripts_history || [],
      base_scripts_for_reference: baseScripts?.map((s: any) => ({
        name: s.name,
        description: s.description,
        steps: s.steps,
        duration_seconds: s.duration_seconds,
        recommended_for_emotions: s.recommended_for_emotions,
      })),
    })

    // Call OpenAI with Action Agent script prompt (with timeout protection)
    const completion = await callOpenAIWithTimeout(
      () => openai.chat.completions.create({
        model: AGENT_MODEL_CONFIG.action_script.model,
        temperature: AGENT_MODEL_CONFIG.action_script.temperature,
        max_tokens: AGENT_MODEL_CONFIG.action_script.max_tokens,
        response_format: AGENT_MODEL_CONFIG.action_script.response_format,
        messages: [
          {
            role: 'system',
            content: ACTION_AGENT_SCRIPT_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      AGENT_TIMEOUTS.action_script  // 10 second timeout
    )

    const responseContent = completion.choices[0].message.content
    if (!responseContent) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse and validate script output
    const rawOutput = JSON.parse(responseContent)
    const scriptOutput: ActionAgentScriptOutput = actionAgentScriptOutputSchema.parse(rawOutput)

    // Run safety validation
    const safetyResult = await validateScriptOutput(scriptOutput)

    // 3. Log safety check
    const scriptSteps = scriptOutput.primary_script.steps.join(' ')
    logSafetyCheck(scriptSteps, safetyResult.passed, safetyResult.flags || [], {
      agentType: 'action_script',
    })

    if (!safetyResult.passed) {
      console.warn('Generated script failed safety check:', safetyResult.reason)
      logFallback('action_script', 'Safety check failed', {
        flags: safetyResult.flags,
        reason: safetyResult.reason,
      })

      // Fallback to static script
      const fallbackScript: any = baseScripts?.[0]

      const fallbackOutput: ActionAgentScriptOutput = {
        primary_script: fallbackScript ? {
          name: fallbackScript.name,
          steps: (fallbackScript.steps as any[]).map((s: any) => s.text || s),
          duration_seconds: fallbackScript.duration_seconds,
          adaptation_note: 'Using evidence-based static script',
        } : {
          name: FALLBACK_MESSAGES.script.name,
          steps: [...FALLBACK_MESSAGES.script.steps],
          duration_seconds: FALLBACK_MESSAGES.script.duration_seconds,
          adaptation_note: 'Fallback script due to generation error',
        },
        alternative_scripts: [],
      }

      return NextResponse.json({
        success: true,
        script: fallbackOutput,
        fallback_used: true,
        safety_result: safetyResult,
        generation_metadata: null,
      }, { status: 200 })
    }

    // Additional pseudoscience check
    const combinedSteps = scriptOutput.primary_script.steps.join(' ')
    const pseudoscienceCheck = checkForPseudoscience(combinedSteps)
    if (pseudoscienceCheck.hasPseudoscience) {
      console.warn('Generated script contains pseudoscience:', pseudoscienceCheck.matched)
      logFallback('action_script', 'Pseudoscience detected', {
        matched: pseudoscienceCheck.matched,
      })

      // Use fallback
      const fallbackScript: any = baseScripts?.[0]
      const fallbackOutput: ActionAgentScriptOutput = {
        primary_script: fallbackScript ? {
          name: fallbackScript.name,
          steps: (fallbackScript.steps as any[]).map((s: any) => s.text || s),
          duration_seconds: fallbackScript.duration_seconds,
          adaptation_note: 'Using evidence-based static script',
        } : {
          name: FALLBACK_MESSAGES.script.name,
          steps: [...FALLBACK_MESSAGES.script.steps],
          duration_seconds: FALLBACK_MESSAGES.script.duration_seconds,
          adaptation_note: 'Fallback script due to pseudoscience detection',
        },
        alternative_scripts: [],
      }

      return NextResponse.json({
        success: true,
        script: fallbackOutput,
        fallback_used: true,
        safety_result: {
          passed: false,
          flags: ['pseudoscience_detected'],
          keyword_violations: pseudoscienceCheck.matched,
          reason: 'Pseudoscience keywords detected in script',
        },
        generation_metadata: null,
      }, { status: 200 })
    }

    const generationTimeMs = Date.now() - startTime
    const tokensUsed = completion.usage?.total_tokens || null

    const safetyFlags = [...(safetyResult.flags || []), 'pseudoscience_check_passed']

    // 4. Log to agent_generations table (fire-and-forget)
    // Note: This is called without round_id since it's not available yet
    // The full logging with round_id happens in POST /api/rounds
    logAgentAction('Script Adaptation Complete', {
      scriptName: scriptOutput.primary_script.name,
      stepCount: scriptOutput.primary_script.steps.length,
      durationSeconds: scriptOutput.primary_script.duration_seconds,
      timeMs: generationTimeMs,
    })

    // Return generation metadata for logging after round creation
    const generationMetadata = {
      agent_type: 'action_script' as const,
      input_context: validatedInput,
      output_content: scriptOutput,
      model_version: AGENT_MODEL_CONFIG.action_script.model,
      safety_flags: safetyFlags,
      generation_time_ms: generationTimeMs,
      tokens_used: tokensUsed,
    }

    return NextResponse.json({
      success: true,
      script: scriptOutput,
      fallback_used: false,
      safety_result: safetyResult,
      generation_metadata: generationMetadata, // Return for later logging
    }, { status: 200 })

  } catch (error) {
    const generationTimeMs = Date.now() - startTime
    console.error('Action Agent (Script) error:', error)

    // 5. Log errors
    // Handle timeout errors - fallback to static script
    if (error instanceof OpenAITimeoutError) {
      console.warn('Script generation timed out, using fallback')
      logFallback('action_script', 'OpenAI timeout', { timeMs: generationTimeMs })
      return NextResponse.json({
        success: true,
        script: {
          primary_script: {
            name: FALLBACK_MESSAGES.script.name,
            steps: [...FALLBACK_MESSAGES.script.steps],
            duration_seconds: FALLBACK_MESSAGES.script.duration_seconds,
            adaptation_note: 'Fallback script due to timeout',
          },
          alternative_scripts: [],
        },
        fallback_used: true,
        safety_result: { passed: false, flags: ['timeout_error'], reason: 'Generation timed out' },
        generation_metadata: null,
      }, { status: 200 })
    }

    // Handle validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      logAgentAction('Script Adaptation Error', {
        error: 'validation_error',
        message: error.message,
        timeMs: generationTimeMs,
      }, 'error')
      return NextResponse.json({
        success: false,
        error: 'validation_error',
        message: 'Invalid request data or response format',
        details: error,
      }, { status: 400 })
    }

    // Return fallback script on any error
    logFallback('action_script', 'Generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timeMs: generationTimeMs,
    })
    return NextResponse.json({
      success: true,
      script: {
        primary_script: {
          name: FALLBACK_MESSAGES.script.name,
          steps: [...FALLBACK_MESSAGES.script.steps],
          duration_seconds: FALLBACK_MESSAGES.script.duration_seconds,
          adaptation_note: 'Fallback script due to generation error',
        },
        alternative_scripts: [],
      },
      fallback_used: true,
      safety_result: { passed: false, flags: ['error_occurred'], reason: 'Generation failed' },
      generation_metadata: null,
    }, { status: 200 })
  }
}
