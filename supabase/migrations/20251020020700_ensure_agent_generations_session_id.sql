-- Ensure agent_generations table has session_id column
-- This migration is idempotent - it will only add the column if it doesn't exist

DO $$
BEGIN
  -- Check if session_id column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'agent_generations'
    AND column_name = 'session_id'
  ) THEN
    -- Add session_id column
    ALTER TABLE agent_generations
      ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE CASCADE;

    -- Add index for session_id
    CREATE INDEX idx_agent_generations_session_id ON agent_generations(session_id);

    RAISE NOTICE 'Added session_id column to agent_generations table';
  ELSE
    RAISE NOTICE 'session_id column already exists in agent_generations table';
  END IF;
END $$;
