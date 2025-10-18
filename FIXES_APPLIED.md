# Critical Fixes Applied - Ada Agent Architecture

**Date:** 2025-10-18
**Status:** ✅ All 3 Critical Fixes Implemented

---

## Summary of Changes

Three critical issues identified in the audit have been fixed:

1. ✅ **Toxicity Detection** - Enhanced safety pipeline with comprehensive toxic pattern detection
2. ✅ **Audit Trail** - Fixed `round_id` foreign key violations in `agent_generations` table
3. ✅ **API Timeouts** - Added timeout protection to prevent hanging sessions

---

## Fix 1: Toxicity Detection

### What Was Fixed
- **Problem:** Only basic keyword filtering existed; subtle toxic language could bypass checks
- **Solution:** Added 40+ toxic pattern keywords across 5 categories

### Files Modified
- `lib/services/agentSafety.ts`

### Changes Made

#### 1. Added Toxic Patterns List (Line 34-57)
```typescript
const TOXIC_PATTERNS = [
  // Derogatory/Insulting
  'worthless', 'pathetic', 'useless', 'disgusting', 'revolting', 'vile',
  'repulsive', 'despicable', 'contemptible', 'insufferable',

  // Dismissive/Belittling
  'cry baby', 'crybaby', 'wimp', 'weakling', 'coward', 'baby',
  'grow up', 'get over it', 'stop being', 'quit being',

  // Exclusionary/Rejection
  'nobody wants', 'no one likes', 'everyone thinks', 'everybody knows',
  'hate you', 'wish you', 'better off without',

  // Shaming
  'should be ashamed', 'embarrassing', 'embarrassment', 'shame on you',
  'disgrace', 'disappointment', 'failed', 'failure',

  // Threatening/Aggressive
  'shut up', 'get lost', 'go away', 'leave me alone', 'i hate',

  // Comparative Harm
  'worse than', 'not as good', 'never be', 'always will be',
]
```

#### 2. Added Toxicity Check Function (Line 203-270)
```typescript
async function checkToxicity(text: string): Promise<{
  passed: boolean
  score?: number
  matched?: string[]
  reason?: string
}>
```

**Behavior:**
- Scans content for toxic patterns
- Calculates toxicity score (0-1) based on number of matches
- **Fails on ANY toxic pattern** (zero tolerance for children's content)
- Returns matched patterns for logging
- Includes TODO for ML-based toxicity detection (Perspective API or TensorFlow.js)

#### 3. Integrated into Safety Pipeline (Line 114-125)
```typescript
// 4. Toxicity detection (subtle harmful language)
const toxicityCheck = await checkToxicity(content)
if (!toxicityCheck.passed) {
  return {
    passed: false,
    flags: ['toxicity_detected', ...flags],
    toxicity_score: toxicityCheck.score,
    keyword_violations: toxicityCheck.matched,
    reason: `Toxic content detected: ${toxicityCheck.reason}`,
  }
}
flags.push('toxicity_check_passed')
```

### Testing

**Test Case 1: Toxic Content Should Fail**
```bash
# Example toxic content that should now be blocked:
"You're so pathetic for not getting this right."
"Stop being such a cry baby about it."
"Nobody wants to be friends with someone like you."

# Expected: safety_result.passed = false, flags includes 'toxicity_detected'
```

**Test Case 2: Safe Content Should Pass**
```bash
# Example safe content that should pass:
"It's okay to feel sad sometimes. Let's try this breathing exercise together."
"You did a great job identifying that emotion!"

# Expected: safety_result.passed = true, flags includes 'toxicity_check_passed'
```

---

## Fix 2: Broken Audit Trail (round_id Issue)

### What Was Fixed
- **Problem:** Story/script generation happens BEFORE round creation, so `round_id` doesn't exist yet
- **Current Code:** Used `child_id` as placeholder → violated foreign key constraint
- **Solution:** Defer logging to `agent_generations` until after round is created

### Files Modified
1. `app/api/agent/generate-story/route.ts`
2. `app/api/agent/generate-script/route.ts`
3. `app/api/agent/generate-praise/route.ts`
4. `app/api/rounds/route.ts`

### Changes Made

#### 1. Generate-Story Route (Lines 137-158)
**Before:**
```typescript
// Tried to insert with invalid round_id = child_id
await supabase.from('agent_generations').insert({
  round_id: validatedInput.child_id,  // ❌ WRONG
  // ...
})
```

**After:**
```typescript
// Return metadata for later logging
const generationMetadata = {
  agent_type: 'action_story' as const,
  input_context: validatedInput,
  output_content: storyOutput,
  model_version: AGENT_MODEL_CONFIG.action_story.model,
  safety_flags: safetyResult.flags || [],
  generation_time_ms: generationTimeMs,
  tokens_used: tokensUsed,
}

return NextResponse.json({
  success: true,
  story: storyOutput,
  generation_metadata: generationMetadata,  // ✅ Return for later logging
})
```

#### 2. Generate-Script Route (Lines 171-191)
Same pattern as generate-story:
- Remove immediate insert attempt
- Return `generation_metadata` in response
- Return `null` for fallback cases

#### 3. Generate-Praise Route (Lines 108-124)
**Before:**
```typescript
round_id: body.round_id || validatedInput.child_nickname,  // ❌ Falls back to nickname!
```

**After:**
```typescript
// Only log if round_id is provided (it exists at praise time)
if (body.round_id) {
  await supabase.from('agent_generations').insert({
    round_id: body.round_id,  // ✅ Valid UUID
    // ...
  })
}
```

#### 4. POST /api/rounds (Lines 77-152)
**Added logging after round creation:**
```typescript
// After round is successfully created
const { data: round, error: roundError } = await supabase
  .from('emotion_rounds')
  .insert(roundData)
  .select()
  .single()

// NOW we have round.id - log the generation!
if ((body as any).storyGenerationMetadata && round) {
  const metadata = (body as any).storyGenerationMetadata
  await supabase
    .from('agent_generations')
    .insert({
      round_id: round.id,  // ✅ Valid UUID from database
      agent_type: metadata.agent_type,
      input_context: metadata.input_context,
      output_content: metadata.output_content,
      model_version: metadata.model_version,
      safety_flags: metadata.safety_flags,
      generation_time_ms: metadata.generation_time_ms,
      tokens_used: metadata.tokens_used,
    })
    .catch(err => console.error('Failed to log agent generation:', err))
}
```

### Testing

**Test Case: Verify Audit Trail**
```sql
-- After creating a round with agent-generated story:

-- 1. Check emotion_rounds has the round
SELECT id, action_agent_story FROM emotion_rounds
WHERE id = 'your-round-id';

-- 2. Check agent_generations has the audit record
SELECT round_id, agent_type, model_version, generation_time_ms, tokens_used
FROM agent_generations
WHERE round_id = 'your-round-id' AND agent_type = 'action_story';

-- Expected:
-- - round_id should match emotion_rounds.id
-- - Foreign key constraint should not fail
-- - Audit trail complete
```

**Test Flow:**
```bash
# 1. Create agent-enabled session
POST /api/sessions
{ "child_id": "...", "agent_enabled": true }

# 2. Create round (triggers story generation)
POST /api/rounds
{ "session_id": "...", "round_number": 1, "age_band": "8-9" }

# 3. Check database
SELECT * FROM agent_generations WHERE agent_type = 'action_story';
# Expected: 1 row with valid round_id
```

---

## Fix 3: API Timeouts

### What Was Fixed
- **Problem:** OpenAI API calls had no timeout → sessions could hang indefinitely
- **Solution:** Added timeout wrapper with configurable limits (5-15 seconds)

### Files Created
- `lib/agents/openai-client.ts` (NEW)

### Files Modified
1. `app/api/agent/observe/route.ts`
2. `app/api/agent/generate-story/route.ts`
3. `app/api/agent/generate-script/route.ts`
4. `app/api/agent/generate-praise/route.ts`

### Changes Made

#### 1. Created Timeout Helper (`lib/agents/openai-client.ts`)
```typescript
export class OpenAITimeoutError extends Error {
  constructor(message: string = 'OpenAI request timed out') {
    super(message)
    this.name = 'OpenAITimeoutError'
  }
}

export async function callOpenAIWithTimeout<T>(
  requestFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  let timeoutId: NodeJS.Timeout

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new OpenAITimeoutError(`Request exceeded ${timeoutMs}ms timeout`))
    }, timeoutMs)
  })

  try {
    const result = await Promise.race([
      requestFn(),
      timeoutPromise
    ])
    clearTimeout(timeoutId!)
    return result
  } catch (error) {
    clearTimeout(timeoutId!)
    throw error
  }
}

// Timeout values by agent type
export const AGENT_TIMEOUTS = {
  observer: 15000,      // 15 seconds (complex analysis)
  action_story: 10000,  // 10 seconds (creative generation)
  action_script: 10000, // 10 seconds (creative generation)
  action_praise: 5000,  // 5 seconds (simple generation)
} as const
```

#### 2. Updated All Agent Routes

**Example: Observer Route (Lines 11, 29-63)**
```typescript
// Added import
import { callOpenAIWithTimeout, AGENT_TIMEOUTS, OpenAITimeoutError } from '@/lib/agents/openai-client'

// Wrapped OpenAI call
const completion = await callOpenAIWithTimeout(
  () => openai.chat.completions.create({
    model: AGENT_MODEL_CONFIG.observer.model,
    // ... other config
  }),
  AGENT_TIMEOUTS.observer  // 15 second timeout
)
```

**Added timeout error handling:**
```typescript
catch (error) {
  // Handle timeout errors
  if (error instanceof OpenAITimeoutError) {
    return NextResponse.json({
      success: false,
      error: 'timeout_error',
      message: 'Observer analysis timed out - please try again',
      details: error.message,
    }, { status: 504 })  // 504 Gateway Timeout
  }
  // ... other error handling
}
```

**Same pattern applied to:**
- `generate-story/route.ts`: 10-second timeout, falls back to static story
- `generate-script/route.ts`: 10-second timeout, falls back to static script
- `generate-praise/route.ts`: 5-second timeout, falls back to generic praise

### Testing

**Test Case 1: Normal Operation (No Timeout)**
```bash
# Call should complete within timeout
curl -X POST http://localhost:3000/api/agent/observe \
  -H "Content-Type: application/json" \
  -d '{ "round_id": "...", ... }'

# Expected: 200 OK with observer_context
```

**Test Case 2: Simulate Slow Response**
```typescript
// Mock OpenAI to delay 20 seconds (exceeds timeout)
// Expected behavior:
// - Observer: Returns 504 error after 15 seconds
// - Story: Returns 200 with fallback story after 10 seconds
// - Script: Returns 200 with fallback script after 10 seconds
// - Praise: Returns 200 with fallback praise after 5 seconds
```

**Test Case 3: Verify Child Experience**
```bash
# Even if agent times out, child should see:
# - Story: Static fallback story (not an error)
# - Script: Static fallback script (not an error)
# - Praise: Generic praise message (not an error)

# Expected: Seamless experience, no broken session
```

---

## Summary of All Changes

### Files Created (1)
- `lib/agents/openai-client.ts` - Timeout wrapper for OpenAI calls

### Files Modified (8)
1. `lib/services/agentSafety.ts` - Added toxicity detection
2. `app/api/agent/observe/route.ts` - Added timeout handling
3. `app/api/agent/generate-story/route.ts` - Deferred logging + timeout
4. `app/api/agent/generate-script/route.ts` - Deferred logging + timeout
5. `app/api/agent/generate-praise/route.ts` - Fixed round_id + timeout
6. `app/api/rounds/route.ts` - Added agent_generations logging

### Lines of Code Changed
- **Added:** ~300 lines
- **Modified:** ~150 lines
- **Total:** ~450 lines changed

---

## Pre-Deployment Checklist

### Before Testing

- [ ] **Run TypeScript type check**
  ```bash
  npm run type-check
  # OR
  npx tsc --noEmit
  ```

- [ ] **Run linter**
  ```bash
  npm run lint
  ```

- [ ] **Build the project**
  ```bash
  npm run build
  ```

### Testing Sequence

1. **Test Toxicity Detection**
   - [ ] Create test story with toxic content
   - [ ] Verify safety check fails
   - [ ] Verify fallback story is used

2. **Test Audit Trail**
   - [ ] Create agent-enabled session
   - [ ] Create round (triggers story generation)
   - [ ] Check `agent_generations` table for valid `round_id`
   - [ ] Verify foreign key constraint is satisfied

3. **Test Timeouts**
   - [ ] Call Observer endpoint
   - [ ] Verify response within 15 seconds
   - [ ] (Optional) Mock slow OpenAI response to test timeout

4. **End-to-End Test**
   - [ ] Create session with `agent_enabled: true`
   - [ ] Complete full 5-round session
   - [ ] Verify `agent_generations` has entries for all rounds
   - [ ] Verify `cumulative_context` builds up in `sessions` table

---

## Rollback Plan

If any issues are discovered:

### Toxicity Detection
```bash
# Revert changes to lib/services/agentSafety.ts
git checkout HEAD~1 -- lib/services/agentSafety.ts
```

### Audit Trail
```bash
# Revert all agent route changes
git checkout HEAD~1 -- app/api/agent/
git checkout HEAD~1 -- app/api/rounds/route.ts
```

### Timeouts
```bash
# Remove timeout wrapper
rm lib/agents/openai-client.ts
# Revert agent route imports
git checkout HEAD~1 -- app/api/agent/
```

---

## Next Steps

1. **Immediate (Before Migration)**
   - [ ] Run build and fix any TypeScript errors
   - [ ] Test locally with curl/Postman
   - [ ] Verify all 3 fixes work as expected

2. **Migration (Week 1)**
   - [ ] Backup database
   - [ ] Run `npx supabase db push`
   - [ ] Verify migration succeeded
   - [ ] Test with real data

3. **Production (Week 2-4)**
   - [ ] Beta test with 5 families (agent-enabled)
   - [ ] Monitor `agent_generations` table for foreign key violations (should be 0)
   - [ ] Monitor timeout frequency
   - [ ] A/B test: 50% agent vs 50% static

---

## Questions?

If you encounter any issues or need clarification:
1. Check build errors: `npm run build`
2. Check type errors: `npx tsc --noEmit`
3. Review this document for expected behavior
4. Test individual endpoints with curl

---

**Status:** ✅ All Critical Fixes Applied
**Ready for:** Local testing → Migration → Beta testing → Production
