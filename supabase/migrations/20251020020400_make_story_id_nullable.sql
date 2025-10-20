-- Make story_id nullable to support agent-generated stories
-- When agents are enabled, stories are stored in action_agent_story JSONB instead of story_id

ALTER TABLE emotion_rounds
  ALTER COLUMN story_id DROP NOT NULL;

-- Add a check constraint to ensure either story_id or action_agent_story is present
ALTER TABLE emotion_rounds
  ADD CONSTRAINT emotion_rounds_story_check
  CHECK (story_id IS NOT NULL OR action_agent_story IS NOT NULL);

COMMENT ON CONSTRAINT emotion_rounds_story_check ON emotion_rounds IS
  'Ensures each round has either a static story (story_id) or agent-generated story (action_agent_story)';
