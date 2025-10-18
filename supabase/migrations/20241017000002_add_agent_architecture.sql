-- Ada Emotion Coach - Two-Agent Architecture Migration
-- Adds Observer Agent and Action Agent support to existing schema

-- ============================================
-- EMOTION ROUNDS TABLE - Add Agent Columns
-- ============================================

ALTER TABLE emotion_rounds
  ADD COLUMN observer_context JSONB,
  ADD COLUMN action_agent_story JSONB,
  ADD COLUMN action_agent_script JSONB,
  ADD COLUMN action_agent_praise TEXT,
  ADD COLUMN generation_metadata JSONB;

-- Add indexes for agent data queries
CREATE INDEX idx_emotion_rounds_observer_context ON emotion_rounds USING GIN (observer_context);
CREATE INDEX idx_emotion_rounds_generation_metadata ON emotion_rounds USING GIN (generation_metadata);

-- ============================================
-- SESSIONS TABLE - Add Agent Support
-- ============================================

ALTER TABLE sessions
  ADD COLUMN cumulative_context JSONB,
  ADD COLUMN agent_enabled BOOLEAN NOT NULL DEFAULT true;

-- Index for feature flag queries
CREATE INDEX idx_sessions_agent_enabled ON sessions(agent_enabled);

-- ============================================
-- AGENT GENERATIONS TABLE - Audit Trail
-- ============================================

CREATE TABLE agent_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES emotion_rounds(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('observer', 'action_story', 'action_script', 'action_praise')),
  input_context JSONB NOT NULL,
  output_content JSONB NOT NULL,
  model_version TEXT NOT NULL,
  safety_flags TEXT[] NOT NULL DEFAULT '{}',
  generation_time_ms INTEGER,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for agent generations queries
CREATE INDEX idx_agent_generations_round_id ON agent_generations(round_id);
CREATE INDEX idx_agent_generations_session_id ON agent_generations(session_id);
CREATE INDEX idx_agent_generations_agent_type ON agent_generations(agent_type);
CREATE INDEX idx_agent_generations_created_at ON agent_generations(created_at DESC);
CREATE INDEX idx_agent_generations_safety_flags ON agent_generations USING GIN (safety_flags);

-- ============================================
-- ROW LEVEL SECURITY - AGENT GENERATIONS
-- ============================================

ALTER TABLE agent_generations ENABLE ROW LEVEL SECURITY;

-- Parents can view agent generations for their children's rounds
CREATE POLICY "Parents can view their children's agent generations"
  ON agent_generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM emotion_rounds
      JOIN sessions ON sessions.id = emotion_rounds.session_id
      JOIN children ON children.id = sessions.child_id
      WHERE emotion_rounds.id = agent_generations.round_id
      AND children.parent_id = auth.uid()
    )
  );

-- System can create agent generations
CREATE POLICY "Agent generations can be created"
  ON agent_generations FOR INSERT
  WITH CHECK (true);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN emotion_rounds.observer_context IS 'Observer Agent analysis of child emotional patterns (JSON)';
COMMENT ON COLUMN emotion_rounds.action_agent_story IS 'Action Agent generated story (JSON)';
COMMENT ON COLUMN emotion_rounds.action_agent_script IS 'Action Agent adapted regulation script (JSON)';
COMMENT ON COLUMN emotion_rounds.action_agent_praise IS 'Action Agent personalized praise message';
COMMENT ON COLUMN emotion_rounds.generation_metadata IS 'Metadata about AI generation (timestamps, models, flags)';

COMMENT ON COLUMN sessions.cumulative_context IS 'Session-level Observer insights accumulated across rounds';
COMMENT ON COLUMN sessions.agent_enabled IS 'Feature flag: Use AI agents (true) or static content (false)';

COMMENT ON TABLE agent_generations IS 'Audit trail for all AI agent generations with safety flags';
