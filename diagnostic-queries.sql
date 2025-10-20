-- Diagnostic SQL queries for debugging the rounds relationship issue
-- Run these in Supabase Studio SQL Editor

-- 1. Check if foreign key constraint exists
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'emotion_rounds'
  AND kcu.column_name = 'session_id';

-- 2. Test the JOIN manually
SELECT
  s.id as session_id,
  s.started_at as session_started,
  er.id as round_id,
  er.round_number,
  er.session_id as round_session_id
FROM sessions s
LEFT JOIN emotion_rounds er ON er.session_id = s.id
WHERE s.id = 'REPLACE_WITH_YOUR_SESSION_ID'
ORDER BY er.round_number;

-- 3. Check rounds for a specific session
SELECT
  id,
  session_id,
  round_number,
  started_at,
  action_agent_story IS NOT NULL as has_agent_story
FROM emotion_rounds
WHERE session_id = 'REPLACE_WITH_YOUR_SESSION_ID'
ORDER BY round_number;

-- 4. Count rounds per session
SELECT
  s.id as session_id,
  s.started_at,
  COUNT(er.id) as round_count
FROM sessions s
LEFT JOIN emotion_rounds er ON er.session_id = s.id
GROUP BY s.id, s.started_at
ORDER BY s.started_at DESC
LIMIT 10;

-- 5. Check RLS policies on emotion_rounds
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'emotion_rounds';

-- 6. Verify service role can read rounds (should return all rounds)
SELECT COUNT(*) FROM emotion_rounds;
