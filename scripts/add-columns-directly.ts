#!/usr/bin/env tsx
/**
 * Directly add missing columns to regulation_scripts table
 * This bypasses the migration system and adds columns directly via SQL
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function addColumns() {
  console.log('🔧 Adding columns to regulation_scripts table...\n');

  // First, check current columns
  const { data: checkData, error: checkError } = await supabase
    .from('regulation_scripts')
    .select('*')
    .limit(1);

  if (!checkError && checkData && checkData.length > 0) {
    console.log('📋 Current columns:', Object.keys(checkData[0]).join(', '));
  }

  // Execute ALTER TABLE via RPC or direct SQL
  const alterTableSQL = `
    DO $$
    BEGIN
      -- Add child_friendly_name if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'regulation_scripts' AND column_name = 'child_friendly_name'
      ) THEN
        ALTER TABLE regulation_scripts ADD COLUMN child_friendly_name TEXT;
        RAISE NOTICE 'Added child_friendly_name column';
      ELSE
        RAISE NOTICE 'child_friendly_name column already exists';
      END IF;

      -- Add supports_repetition if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'regulation_scripts' AND column_name = 'supports_repetition'
      ) THEN
        ALTER TABLE regulation_scripts ADD COLUMN supports_repetition BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added supports_repetition column';
      ELSE
        RAISE NOTICE 'supports_repetition column already exists';
      END IF;

      -- Add choice_category if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'regulation_scripts' AND column_name = 'choice_category'
      ) THEN
        ALTER TABLE regulation_scripts ADD COLUMN choice_category TEXT;
        RAISE NOTICE 'Added choice_category column';
      ELSE
        RAISE NOTICE 'choice_category column already exists';
      END IF;

      -- Add reflection_prompt if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'regulation_scripts' AND column_name = 'reflection_prompt'
      ) THEN
        ALTER TABLE regulation_scripts ADD COLUMN reflection_prompt TEXT;
        RAISE NOTICE 'Added reflection_prompt column';
      ELSE
        RAISE NOTICE 'reflection_prompt column already exists';
      END IF;

      -- Add repeat_offer if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'regulation_scripts' AND column_name = 'repeat_offer'
      ) THEN
        ALTER TABLE regulation_scripts ADD COLUMN repeat_offer TEXT;
        RAISE NOTICE 'Added repeat_offer column';
      ELSE
        RAISE NOTICE 'repeat_offer column already exists';
      END IF;
    END $$;
  `;

  try {
    // Using the SQL editor endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: alterTableSQL })
    });

    if (response.ok) {
      console.log('\n✅ Columns added successfully!');
    } else {
      console.log(`\n⚠️  API method not available (${response.status})`);
      console.log('\nPlease run this SQL directly in Supabase SQL Editor:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Run this query:\n');
      console.log(alterTableSQL);
    }
  } catch (error) {
    console.log('\n⚠️  Direct SQL execution not available');
    console.log('\nPlease run this SQL directly in Supabase SQL Editor:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Paste and run this SQL:\n');
    console.log(alterTableSQL);
  }
}

addColumns();
