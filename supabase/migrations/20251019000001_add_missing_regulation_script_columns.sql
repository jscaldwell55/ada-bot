-- Add missing columns to regulation_scripts table
-- These fields are used in the scripts.json seed data

ALTER TABLE regulation_scripts
  ADD COLUMN child_friendly_name TEXT,
  ADD COLUMN supports_repetition BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN choice_category TEXT,
  ADD COLUMN reflection_prompt TEXT,
  ADD COLUMN repeat_offer TEXT;

-- Add comments for documentation
COMMENT ON COLUMN regulation_scripts.child_friendly_name IS 'Child-friendly name displayed in the UI';
COMMENT ON COLUMN regulation_scripts.supports_repetition IS 'Whether the script can be repeated';
COMMENT ON COLUMN regulation_scripts.choice_category IS 'Category for grouping scripts (calming, movement, awareness)';
COMMENT ON COLUMN regulation_scripts.reflection_prompt IS 'Prompt shown after completing the script';
COMMENT ON COLUMN regulation_scripts.repeat_offer IS 'Text shown when offering to repeat the script';
