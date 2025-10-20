# Polling Optimization - Rate Limiting & Exponential Backoff

## Problem
Previous implementation was polling too aggressively:
- Realtime updates triggered fetches every ~100ms
- Multiple realtime events caused rapid-fire requests (15-30ms apart)
- Fixed 1-second polling continued even after round appeared
- No backoff strategy for failed attempts

## Solution: Multi-Layer Rate Limiting

### 1. Rate Limiting in `fetchSession()` (lib/hooks/useSession.ts)

**Added 500ms minimum interval between silent fetches:**
```typescript
// Rate limiting: Don't fetch more than once per 500ms
const now = Date.now()
if (silent && now - lastFetchTime.current < 500) {
  console.log('[useSession] Rate limited, skipping fetch (too soon)')
  return
}
```

**Why 500ms?**
- Prevents rapid-fire requests from multiple sources
- Still responsive enough for UI updates
- Balances network efficiency with perceived performance

### 2. Debounced Realtime Updates (lib/hooks/useSession.ts)

**Before (BAD):**
```typescript
setTimeout(() => {
  fetchSession(true)
}, 100) // Fires 100ms after EVERY update
```

**After (GOOD):**
```typescript
// Debounce realtime updates - wait 1 second
if (realtimeDebounceTimer.current) {
  clearTimeout(realtimeDebounceTimer.current)
}

realtimeDebounceTimer.current = setTimeout(() => {
  console.log('[useSession] Debounced realtime fetch executing...')
  fetchSession(true)
}, 1000)
```

**How it works:**
- First update: Sets 1-second timer
- Additional updates within 1 second: Reset timer
- Only fetches once after updates settle down
- Prevents multiple fetches from rapid database changes

### 3. Exponential Backoff Polling (app/child/.../page.tsx)

**Before (FIXED INTERVAL):**
```typescript
setInterval(async () => {
  await refreshSession(true)
}, 1000) // Every 1 second forever
```

**After (EXPONENTIAL BACKOFF):**
```typescript
let attempts = 0
let currentDelay = 1000 // Start at 1 second

const schedulePoll = () => {
  pollInterval.current = setTimeout(async () => {
    attempts++
    await refreshSession(true)

    if (attempts >= 10) {
      // Stop after 10 attempts
    } else {
      // Exponential backoff: 1s, 2s, 4s, 8s, 8s...
      currentDelay = Math.min(currentDelay * 2, 8000)
      schedulePoll()
    }
  }, currentDelay)
}
```

**Polling Schedule:**
| Attempt | Delay | Cumulative Time |
|---------|-------|-----------------|
| 1 | 1s | 1s |
| 2 | 2s | 3s |
| 3 | 4s | 7s |
| 4 | 8s | 15s |
| 5 | 8s | 23s |
| 6 | 8s | 31s |
| ... | ... | ... |
| 10 | 8s | ~67s |

**Benefits:**
- Quick initial checks (1-2s) for fast responses
- Backs off to reduce load after failures
- Caps at 8 seconds to avoid excessive waiting
- Stops after 10 attempts (~67 seconds total)

## Request Flow Comparison

### Before Optimization:
```
Round created
└─ Realtime event 1 → fetch after 100ms (at 0.1s)
└─ Realtime event 2 → fetch after 100ms (at 0.2s)
└─ Realtime event 3 → fetch after 100ms (at 0.3s)
└─ Poll attempt 1 → fetch (at 1s)
└─ Poll attempt 2 → fetch (at 2s)
└─ Poll attempt 3 → fetch (at 3s)
... continues every 1 second

Total in first 3 seconds: ~6 requests ❌
```

### After Optimization:
```
Round created
└─ Realtime events 1-3 → debounced, single fetch at 1s
└─ Poll attempt 1 → rate limited (too soon after realtime)
└─ Poll attempt 2 → fetch (at 3s)
└─ Poll attempt 3 → fetch (at 7s)
└─ Poll attempt 4 → fetch (at 15s)
... exponential backoff

Total in first 15 seconds: ~3 requests ✅
```

## Performance Impact

### Network Requests:
- **Before:** 10+ requests in first 10 seconds
- **After:** 3-4 requests in first 15 seconds
- **Reduction:** ~70% fewer requests

### API Load:
- **Before:** Constant 1-second polling
- **After:** Decreasing frequency (1s → 2s → 4s → 8s)
- **Impact:** Significantly reduced server load

### User Experience:
- **Before:** Story appeared in 1-2 seconds (when realtime worked)
- **After:** Story appears in 1-2 seconds (same speed, less waste)
- **Impact:** Same UX, better efficiency

## Files Modified

### lib/hooks/useSession.ts
1. Added refs for rate limiting:
   - `lastFetchTime` - Track last fetch timestamp
   - `realtimeDebounceTimer` - Debounce timer for realtime

2. Added rate limiting to `fetchSession()`:
   - 500ms minimum interval for silent fetches
   - Prevents overlapping requests

3. Debounced realtime subscription:
   - 1-second debounce window
   - Clears previous timer on new events
   - Cleanup on unmount

### app/child/[childId]/session/[sessionId]/page.tsx
1. Replaced `setInterval` with recursive `setTimeout`:
   - Enables exponential backoff
   - More flexible timing control

2. Implemented exponential backoff:
   - Starts at 1 second
   - Doubles each attempt
   - Caps at 8 seconds
   - Stops after 10 attempts

3. Updated cleanup:
   - `clearTimeout` instead of `clearInterval`
   - Proper cleanup on unmount and when round appears

## Monitoring

Watch for these improved log patterns:

### Good (Optimized):
```
[useSession] Fetching session...                    (initial)
[useSession] Round updated via realtime: {...}       (realtime)
[useSession] Debounced realtime fetch executing...   (1s later)
[SessionPage] Polling attempt 1 (delay: 1000ms)...   (1s)
[useSession] Rate limited, skipping fetch            (blocked!)
[SessionPage] Polling attempt 2 (delay: 2000ms)...   (3s)
```

### Bad (Should Not See):
```
[useSession] Fetching session...
[useSession] Fetching session...  // <-- Too fast!
[useSession] Fetching session...  // <-- Too fast!
```

## Testing Recommendations

1. **Check DevTools Network Tab:**
   - Should see ~1-2 requests in first 3 seconds
   - Subsequent polls should increase in interval

2. **Verify Logs:**
   - "Rate limited" messages indicate rate limiting working
   - "Debounced realtime fetch" indicates debouncing working
   - Polling delays should increase: 1s → 2s → 4s → 8s

3. **Test Round Creation:**
   - Round should appear within 1-2 seconds
   - Should not see rapid-fire requests
   - Polling should stop once round appears

## Edge Cases Handled

1. **Multiple Realtime Events:**
   - Debouncing ensures only 1 fetch after events settle
   - Rate limiting prevents overlapping fetches

2. **Slow Network:**
   - Exponential backoff reduces frequency
   - Rate limiting prevents pile-up of requests

3. **Component Unmount:**
   - Debounce timer cleared
   - Polling timeout cleared
   - No memory leaks

4. **Round Appears Mid-Poll:**
   - Polling stops immediately when round detected
   - No wasted requests after success

## Future Optimizations

If needed, could add:
- Jittered backoff (randomize delays slightly)
- Max total polling time limit
- Smart polling (faster when user is active)
- WebSocket keepalive monitoring
