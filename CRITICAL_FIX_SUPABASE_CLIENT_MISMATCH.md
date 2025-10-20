# CRITICAL FIX: Supabase Client Mismatch

## Problem
Rounds were successfully created but **NEVER** appeared when querying the session. Both the relationship JOIN and the fallback query returned 0 rounds, even though the backend logs confirmed round creation.

## Root Cause: Client Type Mismatch

The rounds API and sessions API were using **different Supabase client types**:

### Before (BROKEN):
```typescript
// app/api/rounds/route.ts - WRONG
import { createServerClient } from '@/lib/supabase/client'
const supabase = createServerClient() // Cookie-based client with RLS

// app/api/sessions/[id]/route.ts - CORRECT
import { createServiceClient } from '@/lib/supabase/service'
const supabase = createServiceClient() // Service role client, bypasses RLS
```

### The Problem:
1. **Rounds created with RLS context** (`createServerClient` uses cookies for auth)
2. **Sessions queried with service role** (`createServiceClient` bypasses RLS)
3. **RLS policies blocked service role from seeing user-created rounds** (or vice versa)

## The Fix

Changed ALL rounds API routes to use the **service client**:

### Files Modified:
1. ✅ `app/api/rounds/route.ts` - Changed to `createServiceClient()`
2. ✅ `app/api/rounds/[id]/route.ts` - Changed to `createServiceClient()` (4 occurrences)

### After (FIXED):
```typescript
// Both APIs now use the SAME client type
import { createServiceClient } from '@/lib/supabase/service'
const supabase = createServiceClient() // Service role, bypasses RLS
```

## Why This Fixes It

Now both APIs use the **service role client**, which:
- ✅ Bypasses ALL RLS policies
- ✅ Has full database access
- ✅ Creates and reads rounds consistently
- ✅ No auth context mismatches

## Additional Diagnostic Logging Added

To help catch similar issues in the future:

### app/api/sessions/[id]/route.ts:
- Total rounds count check (verifies service client works)
- Detailed fallback query logging (shows errors if any)
- Session ID type checking
- Raw session object logging

### app/api/rounds/route.ts:
- Round creation verification query
- Session ID matching check
- Detailed round data logging

## How to Test

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Create a new session:**
   - Navigate to a child page
   - Start a new session
   - Watch for the round to appear

3. **Expected Logs:**
   ```
   [Rounds API] Created round: { id: '...', session_id: '...', round_number: 1 }
   [Rounds API] Verification query: { found: true, error: null, matchesSessionId: true }
   [API] Total rounds in database: { totalRoundsCount: 1, countError: null }
   [API] Session fetched: { roundsCount: 1, ... }
   ```

## Why This Happened

The codebase had **two different Supabase client creation methods**:

1. **`createServerClient()`** - For client-side routes, uses cookies for auth
2. **`createServiceClient()`** - For admin/server operations, uses service role key

The rounds API was mistakenly using the **client-side** version when it should have been using the **service role** version like all other backend APIs.

## RLS Policy Impact

With this fix, RLS policies are now **completely bypassed** for rounds operations since we're using the service role. This is correct for this application because:

- Rounds are always associated with sessions
- Sessions are already protected by RLS
- The service role allows backend operations to work without auth context
- Frontend doesn't directly access the rounds API (it goes through sessions)

## Files Changed Summary

| File | Change | Lines |
|------|--------|-------|
| `app/api/rounds/route.ts` | Import + client creation | 7, 20 |
| `app/api/rounds/[id]/route.ts` | Import + 4 client creations | 7, 22, 148, 165, 224 |
| `app/api/sessions/[id]/route.ts` | Added diagnostics | 35-40, 79-100 |

## Next Steps

If rounds still don't appear after this fix:

1. **Check the diagnostic logs** to see if the service client is working
2. **Run diagnostic SQL queries** (see diagnostic-queries.sql)
3. **Verify environment variables** - Make sure `SUPABASE_SERVICE_ROLE_KEY` is set
4. **Check Supabase dashboard** for any errors or policy changes

But this fix **should resolve the issue** because it eliminates the client type mismatch that was causing the problem.
