-- Add missing columns to regulation_scripts table
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query

-- Add child_friendly_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'regulation_scripts'
      AND column_name = 'child_friendly_name'
  ) THEN
    ALTER TABLE public.regulation_scripts ADD COLUMN child_friendly_name TEXT;
    RAISE NOTICE 'Added child_friendly_name column';
  ELSE
    RAISE NOTICE 'child_friendly_name column already exists';
  END IF;
END $$;

-- Add supports_repetition column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'regulation_scripts'
      AND column_name = 'supports_repetition'
  ) THEN
    ALTER TABLE public.regulation_scripts ADD COLUMN supports_repetition BOOLEAN NOT NULL DEFAULT true;
    RAISE NOTICE 'Added supports_repetition column';
  ELSE
    RAISE NOTICE 'supports_repetition column already exists';
  END IF;
END $$;

-- Add choice_category column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'regulation_scripts'
      AND column_name = 'choice_category'
  ) THEN
    ALTER TABLE public.regulation_scripts ADD COLUMN choice_category TEXT;
    RAISE NOTICE 'Added choice_category column';
  ELSE
    RAISE NOTICE 'choice_category column already exists';
  END IF;
END $$;

-- Add reflection_prompt column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'regulation_scripts'
      AND column_name = 'reflection_prompt'
  ) THEN
    ALTER TABLE public.regulation_scripts ADD COLUMN reflection_prompt TEXT;
    RAISE NOTICE 'Added reflection_prompt column';
  ELSE
    RAISE NOTICE 'reflection_prompt column already exists';
  END IF;
END $$;

-- Add repeat_offer column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'regulation_scripts'
      AND column_name = 'repeat_offer'
  ) THEN
    ALTER TABLE public.regulation_scripts ADD COLUMN repeat_offer TEXT;
    RAISE NOTICE 'Added repeat_offer column';
  ELSE
    RAISE NOTICE 'repeat_offer column already exists';
  END IF;
END $$;

-- Force PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'regulation_scripts'
ORDER BY ordinal_position;
