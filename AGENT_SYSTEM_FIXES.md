# Agent System Audit & Fix - Complete Summary

**Date:** 2025-10-18
**Status:** ✅ All fixes implemented, ready for testing

---

## Problem Identified

Ada's two-agent architecture (Observer + Action agents) was documented but not functioning:
- ✅ Database tables existed
- ✅ Agent endpoints existed
- ✅ Logging service existed
- ❌ **All sessions had `agent_enabled = false`**
- ❌ **No logs in `agent_generations` table**
- ❌ **Agents not running during sessions**

---

## Root Causes Found

### 1. Sessions Defaulting to Agents Disabled
**File:** `app/api/sessions/route.ts:40`
```typescript
// BEFORE (line 40)
const agentEnabled = body.agent_enabled === true  // Defaulted to FALSE

// AFTER (line 40)
const agentEnabled = body.agent_enabled !== false  // Defaults to TRUE
```

### 2. Praise Agent Disabled by Feature Flag
**File:** `app/api/praise/route.ts:17`
```typescript
const AGENT_PRAISE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ACTION_PRAISE === 'true'
```
This environment variable was not set, so the praise agent never ran.

### 3. Existing Sessions Had Agents Disabled
All 23 existing sessions in the database had `agent_enabled = false`.

---

## Fixes Implemented

### ✅ 1. Session Creation Now Enables Agents by Default
**File Modified:** `app/api/sessions/route.ts`
- Changed line 40 to default `agent_enabled = true`
- New sessions will automatically have agents enabled

### ✅ 2. Added Required Environment Variables
**Files Modified:** `.env.local`, `.env.example`

Added to `.env.local`:
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ACTION_PRAISE=true
```

Updated `.env.example` with documentation for:
- `NEXT_PUBLIC_SITE_URL` - Used for agent API calls
- `NEXT_PUBLIC_ENABLE_ACTION_PRAISE` - Enables praise agent
- Azure Content Safety (optional)
- PostHog Analytics (optional)

### ✅ 3. Updated All Existing Sessions
**SQL Executed:**
```sql
UPDATE sessions
SET agent_enabled = true
WHERE agent_enabled = false OR agent_enabled IS NULL;

-- Result: 23 sessions updated
-- Verification: SELECT COUNT(*) FROM sessions WHERE agent_enabled = true;
-- Returns: 23 (all sessions now enabled)
```

---

## System Architecture Verified

### ✅ Agent Endpoints (Already Implemented)
1. **Observer Agent** - `app/api/agent/observe/route.ts`
   - Analyzes emotional learning trajectory
   - Logs to database via `logObserverAnalysis()`
   - Uses GPT-4 model
   - Timeout: 15 seconds

2. **Praise Agent** - `app/api/agent/generate-praise/route.ts`
   - Generates personalized praise
   - Logs to database via `logPraiseGeneration()`
   - Uses GPT-4o-mini model
   - Timeout: 5 seconds

3. **Story Agent** - `app/api/agent/generate-story/route.ts`
   - Generates adaptive stories (if agents enabled)
   - Logs to database via `logStoryGeneration()`

4. **Script Agent** - `app/api/agent/generate-script/route.ts`
   - Adapts regulation scripts
   - Logs to database via `logScriptAdaptation()`

### ✅ Logging Service (Already Implemented)
**File:** `lib/services/agentLogger.ts`

Provides:
- Console logging (development) - Structured, timestamped
- Database logging (production) - Persistent audit trail
- Non-blocking, fire-and-forget design
- Graceful degradation on errors

Functions:
- `logAgentGeneration()` - Core database logging
- `logObserverAnalysis()` - Observer-specific logging
- `logPraiseGeneration()` - Praise-specific logging
- `logStoryGeneration()` - Story-specific logging
- `logScriptAdaptation()` - Script-specific logging
- `logSafetyCheck()` - Safety validation logging
- `logFallback()` - Fallback content logging

### ✅ Agent Integration Points (Already Implemented)

1. **Round Completion → Observer Agent**
   - **File:** `app/api/rounds/[id]/route.ts:104-152`
   - **Trigger:** When `post_intensity` is set (round reflection complete)
   - **Flow:**
     ```
     PATCH /api/rounds/{id} with post_intensity
     → Checks session.agent_enabled
     → Fetches previous observer context
     → Calls /api/agent/observe (non-blocking)
     → Observer agent analyzes round
     → Logs to agent_generations table
     → Updates emotion_rounds.observer_context
     → Updates sessions.cumulative_context
     ```

2. **Praise Request → Praise Agent**
   - **File:** `app/api/praise/route.ts:27-64`
   - **Trigger:** When praise is requested for a round
   - **Flow:**
     ```
     POST /api/praise with round_id
     → Checks AGENT_PRAISE_ENABLED flag
     → Calls /api/agent/generate-praise
     → Praise agent generates personalized message
     → Logs to agent_generations table
     → Returns praise to client
     → Falls back to static praise on error
     ```

3. **Round Creation → Story Agent** (if agents enabled)
   - **File:** `app/api/rounds/route.ts:52-89`
   - **Trigger:** When a new round is created with `agent_enabled = true`
   - **Flow:**
     ```
     POST /api/rounds
     → Checks session.agent_enabled
     → Calls /api/agent/generate-story
     → Story agent generates adaptive story
     → Logs to agent_generations table
     → Returns story in round data
     → Falls back to static story on error
     ```

---

## Database Schema

### agent_generations Table
```sql
CREATE TABLE agent_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_type TEXT NOT NULL,  -- 'observer' | 'action_story' | 'action_script' | 'action_praise'
  round_id UUID REFERENCES emotion_rounds(id),
  session_id UUID REFERENCES sessions(id),
  input_context JSONB NOT NULL,
  output_content JSONB NOT NULL,
  model_version TEXT NOT NULL,
  generation_time_ms INTEGER NOT NULL,
  safety_flags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Current State:**
- Total logs: 0 (expected - no sessions have run with agents enabled yet)
- Will populate when new rounds are completed

---

## Testing Checklist

### Test 1: New Session Creation
```bash
# Expected console logs:
[Sessions API] Created session: {id} (agents enabled)
```

### Test 2: Complete a Round
```bash
# Expected flow:
1. Story displayed
2. Label emotion
3. Pre-intensity
4. Script execution
5. Post-intensity → Observer agent called
6. Praise → Praise agent called

# Expected console logs:
[Observer Agent] Called for round: {round_id}
[Agent Logger] ✅ Logged observer generation (XXXXms)
[Praise Agent] Called for round: {round_id}
[Agent Logger] ✅ Logged action_praise generation (XXXms)
```

### Test 3: Database Verification
```sql
-- Check agent logs
SELECT
  agent_type,
  model_version,
  generation_time_ms,
  created_at
FROM agent_generations
ORDER BY created_at DESC
LIMIT 10;

-- Should show observer and action_praise entries

-- Check observer context in rounds
SELECT
  id,
  round_number,
  observer_context->'regulation_effectiveness' as effectiveness,
  observer_context->'confidence_score' as confidence
FROM emotion_rounds
WHERE observer_context IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

### Test 4: Admin Dashboard
```bash
# Visit: http://localhost:3000/admin/agent-logs
# Expected:
- Total Generations: > 0
- Logs in the table
- Observer and Praise entries visible
```

---

## Environment Variables Reference

### Required for Agent System
```bash
# OpenAI API (for all agents)
OPENAI_API_KEY=sk-...

# Supabase (for logging)
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_ACTION_PRAISE=true
```

### Optional
```bash
# Content Safety
AZURE_CONTENT_SAFETY_ENDPOINT=...
AZURE_CONTENT_SAFETY_KEY=...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=...
```

---

## Troubleshooting

### Issue: Still no logs in agent_generations
**Possible Causes:**
1. OpenAI API key not set or invalid
2. Supabase service role key not set
3. Server not restarted after environment changes
4. Round not fully completed (post_intensity not set)

**Solutions:**
```bash
# Verify environment variables
echo $OPENAI_API_KEY
echo $SUPABASE_SERVICE_ROLE_KEY

# Restart development server
# Kill existing server (Ctrl+C)
npm run dev
```

### Issue: "Agent not configured" errors
**Cause:** Missing OpenAI API key

**Solution:**
```bash
# Add to .env.local
OPENAI_API_KEY=sk-...

# Restart server
npm run dev
```

### Issue: Observer agent called but no logs
**Cause:** Supabase service role key missing or incorrect

**Solution:**
```bash
# Verify key
echo $SUPABASE_SERVICE_ROLE_KEY

# Check Supabase connection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1;"
```

### Issue: Praise agent not called
**Cause:** Feature flag disabled

**Solution:**
```bash
# Add to .env.local
NEXT_PUBLIC_ENABLE_ACTION_PRAISE=true

# Restart server
npm run dev
```

---

## Next Steps

1. **Start dev server:** `npm run dev`
2. **Create a new session** or use an existing one
3. **Complete a round** (all steps through praise)
4. **Verify logs:**
   - Console logs show agent calls
   - Database has entries in `agent_generations`
   - Admin dashboard shows logs
5. **Monitor performance:**
   - Observer agent: ~1-2 seconds
   - Praise agent: ~500ms-1s
   - Both are non-blocking

---

## Files Modified

### Code Changes
1. `app/api/sessions/route.ts` - Default agents to enabled
2. `.env.local` - Add `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_ENABLE_ACTION_PRAISE`
3. `.env.example` - Document new environment variables

### Database Changes
1. Updated 23 sessions: `agent_enabled = true`

### Documentation
1. Created `AGENT_SYSTEM_FIXES.md` (this file)

---

## Summary

**Before:**
- ❌ Sessions created with `agent_enabled = false`
- ❌ Praise agent disabled by missing env var
- ❌ 23 existing sessions with agents disabled
- ❌ 0 logs in `agent_generations` table

**After:**
- ✅ New sessions default to `agent_enabled = true`
- ✅ Praise agent enabled via `NEXT_PUBLIC_ENABLE_ACTION_PRAISE=true`
- ✅ All 23 existing sessions updated to `agent_enabled = true`
- ✅ System ready to log agent generations

**Infrastructure (Already Existed):**
- ✅ Observer agent endpoint with logging
- ✅ Praise agent endpoint with logging
- ✅ Story agent endpoint with logging
- ✅ Script agent endpoint with logging
- ✅ Comprehensive logging service
- ✅ Agent calls integrated into round lifecycle
- ✅ Admin dashboard for viewing logs

**The agent system was 95% complete - it just needed to be enabled!**
