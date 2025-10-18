-- Ada Emotion Coach Database Schema
-- Initial Migration
-- Creates all tables, RLS policies, and trigger functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CHILDREN TABLE
-- ============================================
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  age_band TEXT NOT NULL CHECK (age_band IN ('6-7', '8-9', '10-12')),
  avatar_emoji TEXT NOT NULL DEFAULT '=
',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for parent lookups
CREATE INDEX idx_children_parent_id ON children(parent_id);

-- ============================================
-- STORIES TABLE
-- ============================================
CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  emotion TEXT NOT NULL CHECK (emotion IN ('happy', 'sad', 'angry', 'scared', 'surprised', 'disgusted', 'calm')),
  age_band TEXT NOT NULL CHECK (age_band IN ('6-7', '8-9', '10-12')),
  complexity_score INTEGER NOT NULL CHECK (complexity_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for story filtering
CREATE INDEX idx_stories_emotion ON stories(emotion);
CREATE INDEX idx_stories_age_band ON stories(age_band);
CREATE INDEX idx_stories_emotion_age ON stories(emotion, age_band);

-- ============================================
-- REGULATION SCRIPTS TABLE
-- ============================================
CREATE TABLE regulation_scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  recommended_for_emotions TEXT[] NOT NULL,
  recommended_for_intensities INTEGER[] NOT NULL,
  duration_seconds INTEGER NOT NULL,
  steps JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for script filtering
CREATE INDEX idx_scripts_emotions ON regulation_scripts USING GIN (recommended_for_emotions);
CREATE INDEX idx_scripts_intensities ON regulation_scripts USING GIN (recommended_for_intensities);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_rounds INTEGER NOT NULL DEFAULT 5,
  completed_rounds INTEGER NOT NULL DEFAULT 0,
  story_ids TEXT[] NOT NULL DEFAULT '{}'
);

-- Indexes for session queries
CREATE INDEX idx_sessions_child_id ON sessions(child_id);
CREATE INDEX idx_sessions_completed_at ON sessions(completed_at);
CREATE INDEX idx_sessions_child_completed ON sessions(child_id, completed_at);

-- ============================================
-- EMOTION ROUNDS TABLE
-- ============================================
CREATE TABLE emotion_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  story_id TEXT NOT NULL REFERENCES stories(id),
  labeled_emotion TEXT CHECK (labeled_emotion IN ('happy', 'sad', 'angry', 'scared', 'surprised', 'disgusted', 'calm')),
  pre_intensity INTEGER CHECK (pre_intensity BETWEEN 1 AND 5),
  regulation_script_id TEXT REFERENCES regulation_scripts(id),
  post_intensity INTEGER CHECK (post_intensity BETWEEN 1 AND 5),
  praise_message TEXT,
  is_correct BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Ensure unique round numbers per session
  CONSTRAINT unique_session_round UNIQUE(session_id, round_number)
);

-- Indexes for round queries
CREATE INDEX idx_rounds_session_id ON emotion_rounds(session_id);
CREATE INDEX idx_rounds_story_id ON emotion_rounds(story_id);
CREATE INDEX idx_rounds_completed_at ON emotion_rounds(completed_at);

-- ============================================
-- SAFETY ALERTS TABLE
-- ============================================
CREATE TABLE safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  trigger_text TEXT NOT NULL,
  matched_keywords TEXT[] NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  parent_notified BOOLEAN NOT NULL DEFAULT FALSE,
  parent_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for safety alert queries
CREATE INDEX idx_safety_alerts_child_id ON safety_alerts(child_id);
CREATE INDEX idx_safety_alerts_severity ON safety_alerts(severity);
CREATE INDEX idx_safety_alerts_parent_notified ON safety_alerts(parent_notified);
CREATE INDEX idx_safety_alerts_child_notified ON safety_alerts(child_id, parent_notified);

-- ============================================
-- PARENT FEEDBACK TABLE
-- ============================================
CREATE TABLE parent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for feedback queries
CREATE INDEX idx_feedback_child_id ON parent_feedback(child_id);
CREATE INDEX idx_feedback_session_id ON parent_feedback(session_id);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to children table
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment session completed_rounds
CREATE OR REPLACE FUNCTION increment_session_completed_rounds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at IS DISTINCT FROM NEW.completed_at) THEN
    UPDATE sessions
    SET completed_rounds = completed_rounds + 1
    WHERE id = NEW.session_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to emotion_rounds table
CREATE TRIGGER increment_completed_rounds
  AFTER UPDATE ON emotion_rounds
  FOR EACH ROW
  EXECUTE FUNCTION increment_session_completed_rounds();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulation_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - CHILDREN
-- ============================================

-- Parents can view their own children
CREATE POLICY "Parents can view their own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can insert their own children
CREATE POLICY "Parents can create children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Parents can update their own children
CREATE POLICY "Parents can update their own children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- Parents can delete their own children
CREATE POLICY "Parents can delete their own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- ============================================
-- RLS POLICIES - STORIES (Public Read)
-- ============================================

-- Anyone can read stories (no authentication required for browsing)
CREATE POLICY "Stories are publicly readable"
  ON stories FOR SELECT
  USING (true);

-- ============================================
-- RLS POLICIES - REGULATION SCRIPTS (Public Read)
-- ============================================

-- Anyone can read regulation scripts
CREATE POLICY "Regulation scripts are publicly readable"
  ON regulation_scripts FOR SELECT
  USING (true);

-- ============================================
-- RLS POLICIES - SESSIONS
-- ============================================

-- Parents can view sessions for their children
CREATE POLICY "Parents can view their children's sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = sessions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Anyone can create sessions (for child-initiated sessions)
-- Note: In production, you may want to restrict this
CREATE POLICY "Sessions can be created"
  ON sessions FOR INSERT
  WITH CHECK (true);

-- Parents can update their children's sessions
CREATE POLICY "Parents can update their children's sessions"
  ON sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = sessions.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - EMOTION ROUNDS
-- ============================================

-- Parents can view rounds for their children's sessions
CREATE POLICY "Parents can view their children's emotion rounds"
  ON emotion_rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN children ON children.id = sessions.child_id
      WHERE sessions.id = emotion_rounds.session_id
      AND children.parent_id = auth.uid()
    )
  );

-- Anyone can create emotion rounds (for active sessions)
CREATE POLICY "Emotion rounds can be created"
  ON emotion_rounds FOR INSERT
  WITH CHECK (true);

-- Anyone can update emotion rounds (for active sessions)
CREATE POLICY "Emotion rounds can be updated"
  ON emotion_rounds FOR UPDATE
  USING (true);

-- ============================================
-- RLS POLICIES - SAFETY ALERTS
-- ============================================

-- Parents can view safety alerts for their children
CREATE POLICY "Parents can view their children's safety alerts"
  ON safety_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = safety_alerts.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- System can create safety alerts
CREATE POLICY "Safety alerts can be created"
  ON safety_alerts FOR INSERT
  WITH CHECK (true);

-- Parents can update safety alerts for their children (mark as notified)
CREATE POLICY "Parents can update their children's safety alerts"
  ON safety_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = safety_alerts.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- ============================================
-- RLS POLICIES - PARENT FEEDBACK
-- ============================================

-- Parents can view their own feedback
CREATE POLICY "Parents can view their own feedback"
  ON parent_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = parent_feedback.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- Parents can insert feedback for their children
CREATE POLICY "Parents can create feedback for their children"
  ON parent_feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM children
      WHERE children.id = parent_feedback.child_id
      AND children.parent_id = auth.uid()
    )
  );

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE children IS 'Child profiles managed by parents';
COMMENT ON TABLE stories IS 'Emotion recognition stories for different age bands';
COMMENT ON TABLE regulation_scripts IS 'Guided regulation activities';
COMMENT ON TABLE sessions IS 'Practice sessions with 5 rounds each';
COMMENT ON TABLE emotion_rounds IS 'Individual emotion recognition rounds within sessions';
COMMENT ON TABLE safety_alerts IS 'Crisis detection alerts for parent notification';
COMMENT ON TABLE parent_feedback IS 'Parent feedback on session effectiveness';
