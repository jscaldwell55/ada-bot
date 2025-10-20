#!/usr/bin/env tsx
/**
 * Check if regulation_scripts table has all required columns
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkSchema() {
  console.log('🔍 Checking regulation_scripts table schema...\n');

  const { data, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error querying table:', error);
    return;
  }

  console.log('✅ Table is accessible');
  if (data && data.length > 0) {
    console.log('\n📋 Available columns:', Object.keys(data[0]).join(', '));
  } else {
    console.log('\n⚠️  Table is empty, cannot determine columns from data');
    console.log('Trying to insert a test record to verify schema...\n');

    // Try inserting with all fields
    const testScript = {
      id: 'test-script-verification',
      name: 'Test',
      description: 'Test',
      child_friendly_name: 'Test Friendly',
      icon_emoji: '🧪',
      recommended_for_emotions: ['calm'],
      recommended_for_intensities: [1],
      duration_seconds: 30,
      supports_repetition: true,
      choice_category: 'test',
      steps: [{ text: 'test', duration_ms: 1000, emoji: '🧪' }],
      reflection_prompt: 'Test?',
      repeat_offer: 'Test again?'
    };

    const { error: insertError } = await supabase
      .from('regulation_scripts')
      .upsert(testScript);

    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
      console.log('\n💡 The schema cache likely needs to be reloaded.');
      console.log('\nOptions:');
      console.log('1. Go to Supabase Dashboard → Settings → API → Click "Reload schema"');
      console.log('2. Wait 1-2 minutes and try again (cache may auto-refresh)');
      console.log('3. Restart your Supabase project');
    } else {
      console.log('✅ All columns are accessible!');
      console.log('\nYou can now run: npx tsx content/seed.ts');

      // Clean up test record
      await supabase.from('regulation_scripts').delete().eq('id', 'test-script-verification');
    }
  }
}

checkSchema();
