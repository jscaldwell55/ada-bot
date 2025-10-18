-- Add missing metadata column to agent_generations table
-- This column stores additional context about each agent generation

ALTER TABLE agent_generations
  ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add GIN index for efficient JSONB queries on metadata
CREATE INDEX IF NOT EXISTS idx_agent_generations_metadata ON agent_generations USING GIN (metadata);

-- Add comment for documentation
COMMENT ON COLUMN agent_generations.metadata IS 'Additional metadata about agent generation (extracted key metrics, context)';
