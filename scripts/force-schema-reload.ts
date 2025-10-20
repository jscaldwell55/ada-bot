#!/usr/bin/env tsx
/**
 * Force reload PostgREST schema cache using Supabase Management API
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

async function forceReload() {
  console.log('🔄 Forcing schema reload...\n');

  // Method 1: Direct PostgREST endpoint with special header
  console.log('Method 1: Using PostgREST admin endpoint...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'X-PostgREST-Schema-Reload': 'true'
      }
    });

    console.log(`  Response: ${response.status}`);
  } catch (error) {
    console.log(`  ⚠️  Method 1 failed:`, error instanceof Error ? error.message : 'Unknown error');
  }

  // Method 2: Use the root endpoint with specific accept header
  console.log('\nMethod 2: Using root endpoint...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Accept-Profile': 'public',
        'Prefer': 'schema-reload'
      }
    });

    console.log(`  Response: ${response.status}`);
  } catch (error) {
    console.log(`  ⚠️  Method 2 failed:`, error instanceof Error ? error.message : 'Unknown error');
  }

  console.log('\n⏳ Waiting 5 seconds for cache to clear...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test if schema is now available
  console.log('\n🧪 Testing schema availability...');
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testScript = {
    id: 'test-schema-' + Date.now(),
    name: 'Test',
    description: 'Test',
    child_friendly_name: 'Test Friendly Name',
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

  const { error } = await supabase
    .from('regulation_scripts')
    .insert(testScript);

  if (error) {
    console.error('❌ Schema still not loaded:', error.message);
    console.log('\n💡 Next steps:');
    console.log('1. Go to Supabase Dashboard → Settings → API');
    console.log('2. Look for "Schema" or "PostgREST" section');
    console.log('3. Click "Reload schema" or "Restart"');
    console.log('4. Wait 30 seconds and try running the seed again');
    console.log('\nOR try restarting your Supabase project (Settings → General → Restart)');
  } else {
    console.log('✅ Schema successfully reloaded!');
    console.log('\nYou can now run: npx tsx content/seed.ts');

    // Clean up test record
    await supabase.from('regulation_scripts').delete().eq('id', testScript.id);
  }
}

forceReload();
