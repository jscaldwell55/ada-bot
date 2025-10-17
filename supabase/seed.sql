-- Database Seeding SQL for Ada
-- This is an alternative to the TypeScript seed script
-- Run this directly in Supabase SQL Editor

-- Clear existing seed data (optional - comment out to preserve data)
-- DELETE FROM stories;
-- DELETE FROM regulation_scripts;

-- Note: You'll need to manually insert the JSON data from stories.json and scripts.json
-- This SQL file provides the structure. For automated seeding, use content/seed.ts instead

-- Example story insert (repeat for all stories from stories.json):
INSERT INTO stories (id, title, text, emotion, age_band, complexity_score, created_at)
VALUES
  (
    'story-happy-001',
    'Birthday Surprise',
    'Maya woke up and saw balloons everywhere! Her mom had decorated the whole room while she was sleeping. "Surprise!" her family shouted. Maya felt so special and loved.',
    'happy',
    '6-7',
    1,
    NOW()
  ),
  (
    'story-sad-001',
    'The Lost Toy',
    'Sam couldn''t find his favorite stuffed bear anywhere. He looked under his bed, in the toy box, and even in the closet. His eyes felt wet and his chest felt heavy.',
    'sad',
    '6-7',
    1,
    NOW()
  ),
  (
    'story-angry-001',
    'Broken Crayon',
    'Lily was coloring her best drawing ever when her brother grabbed her favorite red crayon and broke it in half. Her face got hot and her hands made tight fists.',
    'angry',
    '6-7',
    1,
    NOW()
  ),
  (
    'story-scared-001',
    'Thunder Night',
    'A loud BOOM woke up Jack in the middle of the night. Lightning flashed through his window. His heart was beating really fast and he pulled his blanket up to his chin.',
    'scared',
    '6-7',
    1,
    NOW()
  ),
  (
    'story-surprised-001',
    'The Rainbow',
    'Emma looked out the window after the rain and gasped. The biggest, brightest rainbow she had ever seen stretched across the sky! Her eyes went wide and her mouth made an "O" shape.',
    'surprised',
    '6-7',
    1,
    NOW()
  );

-- Example regulation script insert (repeat for all scripts from scripts.json):
INSERT INTO regulation_scripts (
  id,
  name,
  description,
  icon_emoji,
  recommended_for_emotions,
  recommended_for_intensities,
  duration_seconds,
  steps,
  created_at
)
VALUES
  (
    'script-bubble-breathing',
    'Bubble Breathing',
    'Breathe slowly like you''re blowing gentle bubbles',
    '>ç',
    ARRAY['angry', 'scared', 'sad']::text[],
    ARRAY[2, 3, 4, 5]::integer[],
    60,
    '[
      {"text": "Let''s blow some calm bubbles together!", "emoji": ">ç", "duration_ms": 3000},
      {"text": "Breathe in slowly through your nose... 1, 2, 3", "emoji": "=C", "duration_ms": 5000},
      {"text": "Now blow out like making a big bubble... slow and gentle", "emoji": "=¨", "duration_ms": 6000},
      {"text": "Great! Let''s do it again. Breathe in... 1, 2, 3", "emoji": "=C", "duration_ms": 5000},
      {"text": "And blow out your bubble... nice and slow", "emoji": ">ç", "duration_ms": 6000},
      {"text": "One more time! Breathe in deeply...", "emoji": "=C", "duration_ms": 5000},
      {"text": "And blow out... watch your calm bubble float away", "emoji": ">ç", "duration_ms": 6000},
      {"text": "Amazing work! You made beautiful calm bubbles!", "emoji": "P", "duration_ms": 4000}
    ]'::jsonb,
    NOW()
  ),
  (
    'script-wall-pushes',
    'Wall Pushes',
    'Push against the wall to release strong feelings',
    '>2',
    ARRAY['angry', 'scared']::text[],
    ARRAY[3, 4, 5]::integer[],
    45,
    '[
      {"text": "Let''s push those big feelings out!", "emoji": ">2", "duration_ms": 3000},
      {"text": "Stand facing a wall and put your hands flat on it", "emoji": ">Í", "duration_ms": 4000},
      {"text": "Now push hard, like you''re trying to move the wall!", "emoji": "=ª", "duration_ms": 8000},
      {"text": "Push, push, push! Use all your strength!", "emoji": "=%", "duration_ms": 8000},
      {"text": "Keep pushing... you''re doing great!", "emoji": "=ª", "duration_ms": 8000},
      {"text": "And... relax. Let your arms drop down.", "emoji": "=", "duration_ms": 5000},
      {"text": "Take a deep breath. Notice how your body feels now.", "emoji": "(", "duration_ms": 5000},
      {"text": "You pushed those big feelings out! Nice job!", "emoji": "P", "duration_ms": 4000}
    ]'::jsonb,
    NOW()
  ),
  (
    'script-5-4-3-2-1',
    '5-4-3-2-1 Grounding',
    'Use your senses to come back to the present moment',
    '=@',
    ARRAY['scared', 'angry', 'sad']::text[],
    ARRAY[3, 4, 5]::integer[],
    90,
    '[
      {"text": "Let''s use our senses to feel calm and safe", "emoji": ">Ø", "duration_ms": 4000},
      {"text": "Look around. Can you find 5 things you can see?", "emoji": "=@", "duration_ms": 8000},
      {"text": "Now find 4 things you can touch. Feel them with your hands.", "emoji": "", "duration_ms": 8000},
      {"text": "Listen carefully. What are 3 things you can hear?", "emoji": "=B", "duration_ms": 8000},
      {"text": "Take a deep breath. What are 2 things you can smell?", "emoji": "=C", "duration_ms": 8000},
      {"text": "Finally, what is 1 thing you can taste?", "emoji": "=E", "duration_ms": 8000},
      {"text": "You did it! You used all 5 senses!", "emoji": "P", "duration_ms": 4000},
      {"text": "Notice how you feel more calm and present now.", "emoji": "(", "duration_ms": 5000}
    ]'::jsonb,
    NOW()
  );

-- Verify the data
SELECT
  (SELECT COUNT(*) FROM stories) as story_count,
  (SELECT COUNT(*) FROM regulation_scripts) as script_count;

-- Display sample data
SELECT emotion, age_band, COUNT(*) as count
FROM stories
GROUP BY emotion, age_band
ORDER BY emotion, age_band;

SELECT name, array_length(recommended_for_emotions, 1) as emotion_count, duration_seconds
FROM regulation_scripts
ORDER BY name;
