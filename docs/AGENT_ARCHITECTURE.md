# Two-Agent Adaptive Architecture

## 📋 Table of Contents

- [Overview](#overview)
- [Why Two Agents?](#why-two-agents)
- [Architecture Diagram](#architecture-diagram)
- [Observer Agent (Reflector/Analyzer)](#observer-agent-reflectoranalyzer)
- [Action Agent (Generator/Facilitator)](#action-agent-generatorfacilitator)
- [Safety Pipeline](#safety-pipeline)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Integration Flow](#integration-flow)
- [Feature Flags & A/B Testing](#feature-flags--ab-testing)
- [Monitoring & Analytics](#monitoring--analytics)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)
- [Clinical Rationale](#clinical-rationale)

---

## Overview

Ada's two-agent architecture transforms static, pre-scripted content into **adaptive, context-aware therapeutic experiences** while maintaining the exact same 8-step session flow and safety guardrails.

### Core Principle

**The session flow remains unchanged.** Agents replace static scripts with adaptive, contextually-informed content generation.

### System Evolution

**Before (Static):**
```
Story Pool (30 static) → Random Selection → Child Labels Emotion →
Static Script → Post-Intensity → Generic Praise → Next Round
```

**After (Adaptive Agent-Based):**
```
Observer Agent (analyzes child's emotional patterns)
    ↓
Session Context (cumulative insights across rounds)
    ↓
Action Agent (generates stories + guidance)
    ↓
Child Interaction (same 8-step flow)
    ↓
Observer Agent (reflects on outcome)
    ↓
Loop continues with enriched context
```

---

## Why Two Agents?

### Separation of Concerns

**Observer Agent** (GPT-4)
- **Role**: Passive reflection and analysis
- **Function**: Understands patterns, tracks progress
- **Output**: Therapeutic context and recommendations
- **Temperature**: 0.3 (consistent, analytical)

**Action Agent** (GPT-4 / GPT-4o-mini)
- **Role**: Active content generation
- **Function**: Creates stories, scripts, and praise
- **Output**: Child-facing therapeutic content
- **Temperature**: 0.5-0.8 (creative, varied)

### Benefits of Separation

1. **Clinical Safety**: Observer analyzes without generating child-facing content
2. **Context Continuity**: Observer builds session-level insights over time
3. **Adaptive Scaffolding**: Action Agent uses Observer insights to personalize content
4. **Specialized Prompts**: Each agent optimized for its specific role
5. **Cost Optimization**: Use appropriate models for each task

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EMOTION ROUND n                           │
└─────────────────────────────────────────────────────────────┘

[BEFORE ROUND STARTS]
    │
    ├─→ Observer Agent retrieves previous round's context
    │   (from session.cumulative_context)
    │
    └─→ Action Agent generates new story based on context
        ├─ Input: Observer recommendations + child profile
        ├─ Process: GPT-4 generation → Safety validation
        └─ Output: Adaptive story OR fallback to static

Step 1-2: GREETING & PRESENTING STORY
    ↓ Display Action Agent's generated story

Step 3: LABELING EMOTION
    ↓ Child selects emotion

Step 4: RATING INTENSITY
    ↓ Child rates 1-5

Step 5-6: OFFERING & RUNNING SCRIPT
    ↓ Action Agent's adapted script (future)
    ↓ OR static script (current)

Step 7: REFLECTING
    ↓ Child re-rates intensity
    ↓ Optional reflection text

Step 8: PRAISING
    ↓ Action Agent's personalized praise

[AFTER ROUND ENDS]
    ↓
    Observer Agent analyzes round data
    ├─ Input: Story, labeled emotion, intensities, script
    ├─ Process: GPT-4 analysis → Pattern detection
    ├─ Output: Context + recommendations
    └─ Stores: observer_context in emotion_rounds
    └─ Updates: session.cumulative_context

┌─────────────────────────────────────────────────────────────┐
│  Repeat for Rounds 2-5 (5 total per session)                │
│  Each round builds on previous Observer insights             │
└─────────────────────────────────────────────────────────────┘
```

---

## Observer Agent (Reflector/Analyzer)

### Role

Passive clinical observer that transforms raw child interaction data into therapeutic context.

### Inputs

```typescript
{
  round_id: string
  round_number: number (1-5)
  story_text: string
  story_theme: string
  target_emotion: EmotionLabel
  labeled_emotion: EmotionLabel
  pre_intensity: IntensityLevel (1-5)
  post_intensity: IntensityLevel (1-5)
  script_name: string
  reflection_text?: string
  previous_context?: ObserverAgentOutput
}
```

### Outputs

```typescript
{
  round_id: string
  story_theme: string
  emotion_trajectory: {
    start: EmotionLabel
    end: EmotionLabel | null
  }
  intensity_delta: number // -4 to +4
  regulation_effectiveness: 'high' | 'medium' | 'low'
  contextual_insights: string[] // ["Child responds well to physical strategies"]
  recommended_next_theme: string // "cooperation" or "patience building"
  recommended_emotion_focus: EmotionLabel
  recommended_complexity: 1 | 2 | 3 | 4 | 5
  confidence_score: number // 0-1
}
```

### Key Behaviors

- **Pattern Detection**: Identifies themes where child shows growth
- **Trend Analysis**: Tracks emotion trajectory across rounds
- **Context Accumulation**: Builds session-level profile
- **Safety Monitoring**: Flags concerning patterns
- **Neurodiversity-Affirming**: Celebrates diverse emotional expressions

### Clinical Guidelines

- ✅ Focus on growth, not deficits
- ✅ NEVER diagnose or pathologize
- ✅ Express low confidence when uncertain
- ✅ Celebrate unique coping styles

### Example Analysis

**Input:**
```json
{
  "story_theme": "sibling conflict",
  "labeled_emotion": "angry",
  "pre_intensity": 4,
  "post_intensity": 2,
  "script_name": "Body Squeeze"
}
```

**Output:**
```json
{
  "emotion_trajectory": { "start": "angry", "end": "calm" },
  "intensity_delta": -2,
  "regulation_effectiveness": "high",
  "contextual_insights": [
    "Child responds well to physical regulation strategies",
    "Anger management showing improvement",
    "Body-based techniques effective for this child"
  ],
  "recommended_next_theme": "managing frustration in social contexts",
  "recommended_emotion_focus": "angry",
  "recommended_complexity": 3,
  "confidence_score": 0.8
}
```

---

## Action Agent (Generator/Facilitator)

### Role

Active participant that generates therapeutic content conditioned on Observer insights.

### Three Sub-Agents

#### 1. Story Generation

**Inputs:**
```typescript
{
  child_id: string
  age_band: '6-7' | '8-9' | '10-12'
  observer_summary?: ObserverAgentOutput
  recommended_emotion?: EmotionLabel
  recommended_theme?: string
  round_number: number
}
```

**Outputs:**
```typescript
{
  story_text: string // 2-3 sentences
  target_emotion: EmotionLabel
  theme: string
  complexity_score: 1 | 2 | 3 | 4 | 5
  contextual_tie?: string
}
```

**Requirements:**
- ✅ Exactly 2-3 sentences
- ✅ Age-appropriate vocabulary
- ✅ Clear emotional scenario
- ✅ Builds on Observer's recommended theme
- ✅ NO violence, abuse, trauma, death

#### 2. Script Adaptation

**Inputs:**
```typescript
{
  child_id: string
  age_band: '6-7' | '8-9' | '10-12'
  labeled_emotion: EmotionLabel
  pre_intensity: IntensityLevel
  observer_insights?: ObserverAgentOutput
  effective_scripts_history?: string[]
  round_number: number
}
```

**Outputs:**
```typescript
{
  primary_script: {
    name: string
    steps: string[] // 4-7 steps
    duration_seconds: number // 30-120
    adaptation_note: string
  }
  alternative_scripts: Array<{
    name: string
    brief_description: string
  }>
}
```

**Requirements:**
- ✅ Evidence-based techniques only (CBT, DBT, sensory integration)
- ✅ NO pseudoscience (chakras, energy healing, etc.)
- ✅ 4-7 clear, simple steps
- ✅ Age-appropriate language
- ✅ 30-90 second duration

#### 3. Praise Generation

**Inputs:**
```typescript
{
  child_nickname: string
  age_band: '6-7' | '8-9' | '10-12'
  observer_analysis?: ObserverAgentOutput
  labeled_emotion: EmotionLabel
  is_correct: boolean
  pre_intensity: IntensityLevel
  post_intensity: IntensityLevel
  script_used: string
  round_number: number
  total_rounds: number
}
```

**Outputs:**
```typescript
{
  praise_message: string // 1-2 sentences
  highlights: string[] // Specific achievements
  encouragement_focus: string // Future-oriented
  badge_emoji?: string
}
```

**Requirements:**
- ✅ Specific to child's actual performance
- ✅ Growth-focused (effort over outcome)
- ✅ Neurodiversity-affirming
- ✅ Avoids toxic positivity

---

## Safety Pipeline

Every agent-generated content passes through a **multi-layer safety pipeline** before reaching the child.

### Content Safety Flow

```
Action Agent Output
    ↓
[1] Schema Validation (JSON structure correct?)
    ↓
[2] Length Check (story ≤3 sentences, script ≤7 steps)
    ↓
[3] Crisis Keyword Filter (suicide, self-harm, violence)
    ↓
[4] Inappropriate Content Filter (scary, adult themes)
    ↓
[5] Pseudoscience Check (for scripts only)
    ↓
[6] Basic Validation (no excessive caps, repetition)
    ↓
PASS → Store in database
FAIL → Log to safety_alerts + Use static fallback content
```

### Safety Checks by Type

**Story Safety:**
- ✅ Length: 10-500 characters
- ✅ Sentence count: 2-4 sentences
- ✅ Crisis keywords: None allowed
- ✅ Inappropriate keywords: Filtered
- ✅ Complexity score: 1-5 range

**Script Safety:**
- ✅ Step count: 4-7 steps
- ✅ Duration: 30-120 seconds
- ✅ Evidence-based only
- ✅ NO pseudoscience
- ✅ Age-appropriate instructions

**Praise Safety:**
- ✅ Length: 10-500 characters
- ✅ Specific (not generic)
- ✅ Growth-focused
- ✅ Neurodiversity-affirming

### Keyword Filters

**Crisis Keywords (Blocked):**
- suicide, kill myself, want to die, hurt myself, end my life

**Inappropriate Keywords (Blocked):**
- blood, death, violence, abuse, scary, terror, drugs, alcohol, weapons

**Pseudoscience Keywords (Blocked for Scripts):**
- chakra, energy healing, aura, crystal healing, reiki, quantum healing

### Fallback Strategy

If ANY safety check fails:
1. Log the incident to `agent_generations` table with safety flags
2. Use static fallback content (from original 30 stories / 5 scripts)
3. Child never sees broken or unsafe experience
4. Parent notification for severe violations (optional)

---

## Database Schema

### New Tables

#### `agent_generations` (Audit Trail)

```sql
CREATE TABLE agent_generations (
  id UUID PRIMARY KEY,
  round_id UUID REFERENCES emotion_rounds(id),
  agent_type TEXT CHECK (agent_type IN ('observer', 'action_story', 'action_script', 'action_praise')),
  input_context JSONB NOT NULL,
  output_content JSONB NOT NULL,
  model_version TEXT NOT NULL,
  safety_flags TEXT[] DEFAULT '{}',
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Complete audit trail of all AI generations with safety flags and performance metrics.

### Extended Tables

#### `emotion_rounds` (New Columns)

```sql
ALTER TABLE emotion_rounds ADD COLUMN observer_context JSONB;
ALTER TABLE emotion_rounds ADD COLUMN action_agent_story JSONB;
ALTER TABLE emotion_rounds ADD COLUMN action_agent_script JSONB;
ALTER TABLE emotion_rounds ADD COLUMN action_agent_praise TEXT;
ALTER TABLE emotion_rounds ADD COLUMN generation_metadata JSONB;
```

#### `sessions` (New Columns)

```sql
ALTER TABLE sessions ADD COLUMN cumulative_context JSONB;
ALTER TABLE sessions ADD COLUMN agent_enabled BOOLEAN DEFAULT true;
```

**Purpose**:
- `cumulative_context`: Stores array of Observer outputs across all rounds
- `agent_enabled`: Feature flag for A/B testing

---

## API Reference

### Observer Agent

**Endpoint**: `POST /api/agent/observe`

**Request Body:**
```json
{
  "round_id": "uuid",
  "round_number": 1,
  "story_text": "Emma's fish Bubbles was not swimming anymore...",
  "story_theme": "loss of a pet",
  "target_emotion": "sad",
  "labeled_emotion": "sad",
  "pre_intensity": 4,
  "post_intensity": 2,
  "script_name": "Calm Breathing",
  "reflection_text": null,
  "previous_context": null
}
```

**Response:**
```json
{
  "success": true,
  "context": {
    "round_id": "uuid",
    "story_theme": "loss of a pet",
    "emotion_trajectory": { "start": "sad", "end": "calm" },
    "intensity_delta": -2,
    "regulation_effectiveness": "high",
    "contextual_insights": ["Child responds well to breathing exercises"],
    "recommended_next_theme": "coping with change",
    "recommended_emotion_focus": "sad",
    "recommended_complexity": 3,
    "confidence_score": 0.7
  },
  "generation_id": "uuid"
}
```

### Action Agent - Story Generation

**Endpoint**: `POST /api/agent/generate-story`

**Request Body:**
```json
{
  "child_id": "uuid",
  "age_band": "8-9",
  "observer_summary": { /* ObserverAgentOutput */ },
  "recommended_emotion": "happy",
  "recommended_theme": "making new friends",
  "round_number": 2
}
```

**Response:**
```json
{
  "success": true,
  "story": {
    "story_text": "Maya joined a new soccer team and felt nervous. The other kids smiled and asked her to play. Maya scored a goal and everyone cheered!",
    "target_emotion": "happy",
    "theme": "making new friends",
    "complexity_score": 2,
    "contextual_tie": "Building on child's success with social scenarios"
  },
  "fallback_used": false,
  "safety_result": {
    "passed": true,
    "flags": ["length_valid", "crisis_keywords_passed", "all_checks_passed"]
  }
}
```

### Action Agent - Script Adaptation

**Endpoint**: `POST /api/agent/generate-script`

**Request Body:**
```json
{
  "child_id": "uuid",
  "age_band": "8-9",
  "labeled_emotion": "angry",
  "pre_intensity": 4,
  "observer_insights": { /* ObserverAgentOutput */ },
  "round_number": 3
}
```

**Response:**
```json
{
  "success": true,
  "script": {
    "primary_script": {
      "name": "Calm Breathing (Adapted for Anger)",
      "steps": [
        "Place one hand on your belly.",
        "Breathe in slowly through your nose for 4 counts.",
        "Hold your breath for 2 counts.",
        "Breathe out slowly through your mouth for 6 counts.",
        "Repeat 3 times and notice how your body feels calmer."
      ],
      "duration_seconds": 45,
      "adaptation_note": "Extended exhale helps activate calm response for high-intensity anger."
    },
    "alternative_scripts": [
      { "name": "Body Squeeze", "brief_description": "Tighten and release muscles" },
      { "name": "Count and Breathe", "brief_description": "Slow counting with deep breaths" }
    ]
  },
  "fallback_used": false,
  "safety_result": { "passed": true, "flags": ["all_checks_passed"] }
}
```

### Action Agent - Praise Generation

**Endpoint**: `POST /api/agent/generate-praise`

**Request Body:**
```json
{
  "child_nickname": "Alex",
  "age_band": "8-9",
  "observer_analysis": { /* ObserverAgentOutput */ },
  "labeled_emotion": "angry",
  "is_correct": true,
  "pre_intensity": 4,
  "post_intensity": 2,
  "intensity_delta": -2,
  "script_used": "Calm Breathing",
  "round_number": 3,
  "total_rounds": 5
}
```

**Response:**
```json
{
  "success": true,
  "praise": {
    "praise_message": "You recognized that angry feeling and used breathing to help yourself feel calmer. That took real courage, Alex!",
    "highlights": [
      "Correctly identified anger",
      "Reduced intensity from 4 to 2 using breathing"
    ],
    "encouragement_focus": "Keep noticing when big feelings come up - you're getting really good at this!",
    "badge_emoji": "🏆"
  },
  "fallback_used": false,
  "safety_result": { "passed": true, "flags": ["all_checks_passed"] }
}
```

---

## Integration Flow

### Session Creation (Round 0)

```typescript
// POST /api/sessions
{
  child_id: "uuid",
  agent_enabled: true  // Feature flag (default: true)
}

// If agent_enabled = true:
//   - story_ids = [] (empty, generated per round)
//   - cumulative_context = null

// If agent_enabled = false:
//   - story_ids = [5 pre-selected stories]
//   - Uses static content flow
```

### Round Start (Before Step 1)

```typescript
// POST /api/rounds
// 1. Check session.agent_enabled
// 2. If true:
//    - Fetch previous Observer context from session.cumulative_context
//    - Call /api/agent/generate-story
//    - Validate and safety-check generated story
//    - Store in emotion_rounds.action_agent_story
// 3. If false or generation fails:
//    - Use static story from session.story_ids
```

### Round End (After Step 7)

```typescript
// PATCH /api/rounds/:id with post_intensity
// 1. Check session.agent_enabled
// 2. If true:
//    - Non-blocking call to /api/agent/observe
//    - Observer analyzes round data
//    - Updates emotion_rounds.observer_context
//    - Appends to session.cumulative_context
// 3. User proceeds to Step 8 (doesn't wait for Observer)
```

### Praise Generation (Step 8)

```typescript
// POST /api/praise with round_id
// 1. Check session.agent_enabled
// 2. If true:
//    - Fetch round.observer_context
//    - Call /api/agent/generate-praise
//    - Return personalized praise
// 3. If false or generation fails:
//    - Use static GPT-4o-mini praise (original flow)
```

---

## Feature Flags & A/B Testing

### Session-Level Flag

**Enable agents for a session:**
```typescript
POST /api/sessions
{
  child_id: "uuid",
  agent_enabled: true  // Default: true
}
```

**Disable agents (use static content):**
```typescript
POST /api/sessions
{
  child_id: "uuid",
  agent_enabled: false  // Static stories, scripts, praise
}
```

### A/B Testing Strategy

**50/50 Split:**
```typescript
const agentEnabled = Math.random() < 0.5

await fetch('/api/sessions', {
  method: 'POST',
  body: JSON.stringify({
    child_id: childId,
    agent_enabled: agentEnabled
  })
})
```

**Cohort-Based:**
```typescript
// Assign cohort on child creation
const cohort = childId.charCodeAt(0) % 2 === 0 ? 'agent' : 'static'

const agentEnabled = cohort === 'agent'
```

### Metrics to Track

**Agent Performance:**
- Generation success rate
- Average generation time
- Fallback frequency
- Safety flag distribution

**Clinical Efficacy:**
- Emotion accuracy (agent vs static)
- Intensity delta (agent vs static)
- Session completion rate
- Parent satisfaction scores

---

## Monitoring & Analytics

### Database Queries

**View all agent generations:**
```sql
SELECT
  agent_type,
  model_version,
  safety_flags,
  generation_time_ms,
  created_at
FROM agent_generations
ORDER BY created_at DESC
LIMIT 20;
```

**Check Observer insights for a session:**
```sql
SELECT
  round_number,
  observer_context->'regulation_effectiveness' as effectiveness,
  observer_context->'contextual_insights' as insights,
  observer_context->'confidence_score' as confidence
FROM emotion_rounds
WHERE session_id = 'your-session-id'
ORDER BY round_number;
```

**Monitor safety failures:**
```sql
SELECT
  agent_type,
  safety_flags,
  output_content,
  created_at
FROM agent_generations
WHERE NOT ('all_checks_passed' = ANY(safety_flags))
ORDER BY created_at DESC;
```

**Track generation performance:**
```sql
SELECT
  agent_type,
  AVG(generation_time_ms) as avg_time_ms,
  AVG(tokens_used) as avg_tokens,
  COUNT(*) as total_generations
FROM agent_generations
GROUP BY agent_type;
```

### Observability Dashboard

**Key Metrics:**
- ✅ Generation success rate by agent type
- ✅ Average response time per agent
- ✅ Fallback frequency (indicates quality issues)
- ✅ Safety flag distribution
- ✅ Cost per session (token usage)

**Alerts:**
- ⚠️ Fallback rate > 20%
- ⚠️ Generation time > 5 seconds
- ⚠️ Safety violations detected
- ⚠️ API errors > 5% rate

---

## Testing Guide

### Unit Tests

**Observer Agent:**
```typescript
describe('Observer Agent', () => {
  it('should generate valid context from round data', async () => {
    const response = await fetch('/api/agent/observe', {
      method: 'POST',
      body: JSON.stringify(mockRoundData)
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.context.regulation_effectiveness).toMatch(/high|medium|low/)
  })

  it('should handle low confidence scenarios', async () => {
    const response = await fetch('/api/agent/observe', {
      method: 'POST',
      body: JSON.stringify(inconsistentRoundData)
    })

    const data = await response.json()
    expect(data.context.confidence_score).toBeLessThan(0.5)
  })
})
```

**Action Agent - Story:**
```typescript
describe('Action Agent - Story Generation', () => {
  it('should generate age-appropriate stories', async () => {
    const response = await fetch('/api/agent/generate-story', {
      method: 'POST',
      body: JSON.stringify({
        child_id: 'uuid',
        age_band: '6-7',
        round_number: 1
      })
    })

    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.story.story_text.length).toBeGreaterThan(10)
    expect(data.story.complexity_score).toBeGreaterThanOrEqual(1)
  })

  it('should fall back on safety failure', async () => {
    // Mock OpenAI to return unsafe content
    const response = await fetch('/api/agent/generate-story', ...)

    const data = await response.json()
    expect(data.fallback_used).toBe(true)
    expect(data.safety_result.passed).toBe(false)
  })
})
```

### Integration Tests

**Full Session Flow:**
```typescript
describe('Agent-Enabled Session', () => {
  it('should complete full 5-round session with agents', async () => {
    // 1. Create session with agents enabled
    const session = await createSession({ agent_enabled: true })

    // 2. For each round:
    for (let i = 1; i <= 5; i++) {
      // - Create round (should generate story)
      const round = await createRound({ round_number: i })
      expect(round.action_agent_story).toBeDefined()

      // - Complete labeling and regulation
      await updateRound(round.id, { labeled_emotion: 'happy', pre_intensity: 3 })

      // - Complete reflection (triggers Observer)
      await updateRound(round.id, { post_intensity: 2 })

      // - Check Observer context was created
      const updatedRound = await getRound(round.id)
      expect(updatedRound.observer_context).toBeDefined()

      // - Generate praise
      const praise = await generatePraise({ round_id: round.id })
      expect(praise.agent_generated).toBe(true)
    }

    // 3. Verify cumulative context built up
    const finalSession = await getSession(session.id)
    expect(finalSession.cumulative_context).toHaveLength(5)
  })
})
```

### Safety Tests

```typescript
describe('Safety Pipeline', () => {
  it('should block stories with crisis keywords', async () => {
    // Mock OpenAI to return story with "suicide"
    const response = await fetch('/api/agent/generate-story', ...)

    expect(response.fallback_used).toBe(true)
    expect(response.safety_result.flags).toContain('crisis_keywords_detected')
  })

  it('should block scripts with pseudoscience', async () => {
    // Mock script with "chakra healing"
    const response = await fetch('/api/agent/generate-script', ...)

    expect(response.fallback_used).toBe(true)
    expect(response.safety_result.keyword_violations).toContain('chakra')
  })
})
```

---

## Troubleshooting

### Common Issues

#### 1. **Observer Agent Not Running**

**Symptoms:**
- `observer_context` is null in database
- `cumulative_context` not building up

**Fixes:**
```bash
# Check if session has agents enabled
SELECT agent_enabled FROM sessions WHERE id = 'your-session-id';

# Verify Observer endpoint is accessible
curl -X POST http://localhost:3000/api/agent/observe \
  -H "Content-Type: application/json" \
  -d '{ "round_id": "uuid", ... }'

# Check application logs for Observer errors
# Look for: "Observer Agent call failed (non-blocking)"
```

#### 2. **Stories Not Generating (Falling Back to Static)**

**Symptoms:**
- `action_agent_story` is null
- `fallback_used: true` in responses

**Fixes:**
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Verify story generation endpoint
curl -X POST http://localhost:3000/api/agent/generate-story \
  -H "Content-Type: application/json" \
  -d '{ "child_id": "uuid", "age_band": "8-9", "round_number": 1 }'

# Check safety flags in agent_generations table
SELECT safety_flags FROM agent_generations
WHERE agent_type = 'action_story'
ORDER BY created_at DESC LIMIT 10;
```

#### 3. **Praise Not Personalized**

**Symptoms:**
- Generic praise messages
- `agent_generated: false` in response

**Fixes:**
```bash
# Ensure round_id is passed to /api/praise
# Check if observer_context exists for that round
SELECT observer_context FROM emotion_rounds WHERE id = 'round-id';

# Verify agent_enabled for session
SELECT sessions.agent_enabled
FROM emotion_rounds
JOIN sessions ON sessions.id = emotion_rounds.session_id
WHERE emotion_rounds.id = 'round-id';
```

#### 4. **High Fallback Rate**

**Causes:**
- Safety pipeline too strict
- OpenAI API rate limits
- Model temperature too high (generating unsafe content)

**Fixes:**
```sql
-- Analyze safety flags
SELECT
  agent_type,
  safety_flags,
  COUNT(*)
FROM agent_generations
WHERE NOT ('all_checks_passed' = ANY(safety_flags))
GROUP BY agent_type, safety_flags;

-- If too many 'length_violation':
--   → Adjust prompts to emphasize brevity

-- If too many 'keyword_violations':
--   → Review keyword list in lib/services/agentSafety.ts
--   → Potentially relax filters (with clinical review)
```

### Error Messages

**"Empty response from OpenAI"**
- Check API key validity
- Verify OpenAI account has credits
- Check rate limits

**"validation_error: Invalid request data"**
- Zod schema validation failed
- Check input matches schema in lib/validation/schemas.ts

**"Story too short (X < 10 chars)"**
- Model generated incomplete response
- Increase max_tokens in AGENT_MODEL_CONFIG

---

## Clinical Rationale

### Why Adaptive Content?

**Problem with Static Content:**
- Same child may see the same story multiple times across sessions
- No accommodation for individual differences in emotional development
- Generic praise doesn't celebrate specific achievements
- Scripts don't adapt to what actually works for each child

**Solution with Agents:**
- Stories progressively scaffold based on demonstrated skills
- Content matches child's current developmental zone
- Praise highlights actual progress and effort
- Scripts personalize to preferred regulation strategies

### Evidence-Based Foundations

**Observer Agent** draws from:
- **Cognitive-Behavioral Therapy (CBT)**: Pattern recognition and cognitive restructuring
- **Dialectical Behavior Therapy (DBT)**: Emotion regulation skills tracking
- **Applied Behavior Analysis (ABA)**: Data-driven intervention adjustment

**Action Agent** implements:
- **Zone of Proximal Development (Vygotsky)**: Adaptive complexity scaffolding
- **Growth Mindset (Dweck)**: Effort-focused praise
- **Neurodiversity-Affirming Practice**: Celebrates diverse coping styles

### Therapeutic Benefits

**Personalization:**
- Child who excels with breathing gets more breathing variations
- Child who struggles with anger gets anger-focused stories
- Child making progress gets increased complexity

**Engagement:**
- Novel stories maintain interest across multiple sessions
- Specific praise feels authentic and meaningful
- Adaptive difficulty prevents boredom or frustration

**Clinical Insight:**
- Parents see detailed progress tracking in Observer context
- Therapists can review cumulative insights for treatment planning
- Data-driven recommendations for next therapeutic targets

### Safety & Ethics

**Clinical Oversight:**
- All content safety-checked before reaching child
- Observer never diagnoses, only describes patterns
- Fallback to clinician-vetted static content on any uncertainty

**Transparency:**
- All AI generations logged with timestamps and safety flags
- Parents can review exactly what content child received
- Audit trail supports quality assurance and research

**Neurodiversity Affirming:**
- Celebrates diverse emotional expressions and coping styles
- Avoids pathologizing language
- Focuses on strengths and growth

---

## Next Steps

### Immediate (Week 1)

- [ ] Apply database migration
- [ ] Configure OpenAI API key
- [ ] Test Observer Agent on 10 rounds
- [ ] Verify safety pipeline blocks unsafe content
- [ ] Monitor generation performance

### Short-Term (Month 1)

- [ ] A/B test: 50% agent-enabled, 50% static
- [ ] Collect metrics: accuracy, delta, completion rate
- [ ] Parent feedback survey on personalized content
- [ ] Clinician review of Observer insights (n=20 sessions)
- [ ] Optimize prompts based on real-world data

### Medium-Term (Quarter 1)

- [ ] Expand script adaptation (currently using static)
- [ ] Add reflection text analysis to Observer
- [ ] Build parent dashboard showing Observer insights
- [ ] Implement cost optimization (token usage reduction)
- [ ] Research study: Agent vs Static efficacy (n=100)

### Long-Term (Year 1)

- [ ] Multi-session context (track child across sessions)
- [ ] Therapist portal for reviewing AI insights
- [ ] Automated intervention recommendations
- [ ] Integration with external EHR systems
- [ ] Publish peer-reviewed efficacy study

---

## Resources

### Documentation
- [Main README](../README.md)
- [Database Schema](../supabase/migrations/)
- [API Types](../types/agents.ts)
- [System Prompts](../lib/agents/prompts.ts)

### Research References
- Kendall, P.C. (2012). "Child and Adolescent Therapy: Cognitive-Behavioral Procedures"
- Gross, J.J. (2015). "Emotion Regulation: Current Status and Future Prospects"
- Mahler, K. (2018). "Interoception: The Eighth Sensory System"

### External Tools
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Zod Validation Library](https://zod.dev/)

---

**For questions or issues, please open a GitHub issue or contact the development team.**

Last Updated: 2024-10-17
