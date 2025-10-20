#!/usr/bin/env tsx
/**
 * Reload Supabase PostgREST Schema Cache
 * This forces PostgREST to pick up new database columns
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function reloadSchema() {
  try {
    console.log('🔄 Reloading PostgREST schema cache...');

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'schema-reload'
      }
    });

    if (response.ok || response.status === 204) {
      console.log('✅ Schema cache reloaded successfully!');
      console.log('\nNow you can re-run the seed:');
      console.log('  npx tsx content/seed.ts');
    } else {
      console.log(`⚠️  Response status: ${response.status}`);
      console.log('This might be okay - try running the seed anyway.');
    }
  } catch (error) {
    console.error('❌ Error reloading schema:', error);
    console.log('\nAlternative: Go to Supabase Dashboard → Settings → API → Reload Schema');
  }
}

reloadSchema();
