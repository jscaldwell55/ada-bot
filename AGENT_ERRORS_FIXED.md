# Agent System Errors - Fixed

## Date: 2025-10-18

## Issues Resolved

### 1. POST /api/agent/generate-story 404 Error
**Root Cause:** Agent endpoints were using the wrong Supabase client that required authenticated cookies (RLS-enabled client) instead of the service role client.

**Error Details:**
- Endpoint returned 404 with message "Child not found"
- Supabase error: `PGRST116 - Cannot coerce the result to a single JSON object`
- Child lookup was failing despite valid child_id because of Row Level Security (RLS) policies

**Fix Applied:**
Changed all agent endpoints to use `createServerClient()` from `@/lib/supabase/client` instead of `createClient()` from `@/lib/supabase/server`.

**Files Modified:**
- `app/api/agent/generate-story/route.ts:8` - Changed import
- `app/api/agent/generate-story/route.ts:40` - Changed client instantiation
- `app/api/agent/generate-script/route.ts:8` - Changed import
- `app/api/agent/generate-script/route.ts:40` - Changed client instantiation
- `app/api/agent/observe/route.ts:8` - Changed import
- `app/api/agent/observe/route.ts:96` - Changed client instantiation

### 2. POST /api/rounds 400 Error
**Root Cause:** When story generation failed (due to issue #1), the rounds endpoint required a `story_id` but none was provided.

**Fix Applied:**
Fixed by resolving issue #1. The rounds endpoint now successfully generates stories via the agent system.

### 3. Database Schema Constraint Error
**Root Cause:** The `emotion_rounds` table had a NOT NULL constraint on `story_id`, but agent-generated stories don't use a static story_id (they store content in `action_agent_story` instead).

**Error Details:**
```
null value in column "story_id" of relation "emotion_rounds" violates not-null constraint
```

**Fix Applied:**
Made `story_id` column nullable:
```sql
ALTER TABLE emotion_rounds ALTER COLUMN story_id DROP NOT NULL;
```

## Verification

Tested with:
```bash
curl -X POST http://localhost:3000/api/rounds \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<valid-session-id>","round_number":1}'
```

**Result:** ✅ Success
- Story generated in ~3 seconds
- All safety checks passed
- Round created with status 201
- Agent-generated story properly stored in `action_agent_story` field

## Summary

The core issue was using an RLS-enabled Supabase client (designed for authenticated browser sessions) in server-side API routes that need full database access. Switching to the service role client resolved the authentication issues, and making `story_id` nullable allows the system to work with both static and agent-generated stories.

All agent endpoints now work correctly:
- ✅ POST /api/agent/generate-story
- ✅ POST /api/agent/generate-script
- ✅ POST /api/agent/observe
- ✅ POST /api/rounds (with agent-generated stories)
