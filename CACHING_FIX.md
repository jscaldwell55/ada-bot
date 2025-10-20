# Caching Fix - Prevent Stale Empty Rounds

## Problem
Even after fixing the Supabase client mismatch, Next.js aggressive caching could still cause issues:
- API routes cache responses by default
- Client-side fetch() caches GET requests
- This could cache empty `rounds: []` arrays before rounds are created

## Solution: Disable All Caching

### Server-Side: API Route Caching Disabled

Added to **ALL** session/round API routes:

```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

#### Files Modified:
1. ✅ `app/api/sessions/route.ts` (POST sessions)
2. ✅ `app/api/sessions/[id]/route.ts` (GET session)
3. ✅ `app/api/rounds/route.ts` (POST rounds)
4. ✅ `app/api/rounds/[id]/route.ts` (PATCH round)

### Client-Side: Fetch Caching Disabled

Added `cache: 'no-store'` to **ALL** session/round fetch calls:

```typescript
fetch('/api/sessions/...', {
  cache: 'no-store', // Disable caching
  // ... other options
})
```

#### Files Modified:
1. ✅ `lib/hooks/useSession.ts`
   - GET session (line 66)
   - PATCH session (line 152)
   - POST session (line 225)

2. ✅ `app/child/[childId]/session/[sessionId]/page.tsx`
   - POST rounds (line 90)

## Why This Matters

### Without These Fixes:
1. **Initial GET** `/api/sessions/{id}` → Returns `rounds: []` (empty)
2. **Next.js caches** this response
3. **POST** `/api/rounds` → Creates round successfully
4. **Subsequent GET** `/api/sessions/{id}` → Returns **cached** `rounds: []` ❌

### With These Fixes:
1. **Initial GET** `/api/sessions/{id}` → Returns `rounds: []` (empty)
2. **Response NOT cached** (force-dynamic + no-store)
3. **POST** `/api/rounds` → Creates round successfully
4. **Subsequent GET** `/api/sessions/{id}` → Fetches fresh data → Returns `rounds: [...]` ✅

## How Next.js Caching Works

### Route Segment Config
```typescript
export const dynamic = 'force-dynamic'  // Disable static generation
export const revalidate = 0             // Don't cache responses
```

This tells Next.js:
- Don't prerender at build time
- Don't cache responses
- Always run on the server at request time

### Fetch Cache Option
```typescript
fetch(url, { cache: 'no-store' })
```

This tells the browser/Next.js:
- Don't use cached responses
- Always make a fresh network request
- Don't cache the response

## Combined Fix Summary

To completely eliminate caching issues for sessions/rounds:

| Component | What Was Added | Why |
|-----------|---------------|-----|
| API Routes | `export const dynamic = 'force-dynamic'` | Prevents Next.js from caching responses |
| API Routes | `export const revalidate = 0` | Disables revalidation caching |
| Client Fetches | `cache: 'no-store'` | Prevents browser/client caching |

## Testing

After these changes, every request should be fresh:

1. **Check browser DevTools Network tab**:
   - No `(disk cache)` or `(memory cache)` labels
   - All requests should show actual response times

2. **Verify rounds appear immediately**:
   - Create a session
   - Round creation should complete
   - Polling/realtime should show the round within 1-2 seconds

3. **Console logs should show**:
   ```
   [API] Session fetched: { roundsCount: 0, ... }  // Before creation
   [API] Session fetched: { roundsCount: 1, ... }  // After creation ✓
   ```

## Files Changed

### API Routes (Server-Side):
- `app/api/sessions/route.ts` (+2 lines)
- `app/api/sessions/[id]/route.ts` (+2 lines)
- `app/api/rounds/route.ts` (+2 lines)
- `app/api/rounds/[id]/route.ts` (+2 lines)

### Client Code:
- `lib/hooks/useSession.ts` (+3 cache options)
- `app/child/[childId]/session/[sessionId]/page.tsx` (+1 cache option)

## Related Fixes

This caching fix works together with:
1. **Supabase Client Fix** - Ensures both APIs use the same service client
2. **Realtime Subscription** - Provides backup updates via WebSocket
3. **Polling Fallback** - Ensures rounds appear even if realtime fails

Together, these three systems ensure rounds **always** appear quickly:
- Service client eliminates RLS mismatches
- No caching ensures fresh data
- Realtime + polling provide redundant update mechanisms

## References

- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Next.js Data Fetching - Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- [Fetch API - cache option](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache)
