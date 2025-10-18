/**
 * Database Seeding Script for Ada
 * Populates Supabase with stories and regulation scripts from JSON files
 *
 * Usage: npx tsx content/seed.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import storiesData from './stories.json'
import scriptsData from './scripts.json'

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function seedStories() {
  console.log('📚 Seeding stories...')

  const { data, error } = await supabase
    .from('stories')
    .upsert(storiesData.stories as any, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('❌ Error seeding stories:', error)
    throw error
  }

  console.log(`✅ Seeded ${data.length} stories`)
  return data
}

async function seedRegulationScripts() {
  console.log('📚 Seeding regulation scripts...')

  const { data, error } = await supabase
    .from('regulation_scripts')
    .upsert(scriptsData.scripts as any, { onConflict: 'id' })
    .select()

  if (error) {
    console.error('❌ Error seeding regulation scripts:', error)
    throw error
  }

  console.log(`✅ Seeded ${data.length} regulation scripts`)
  return data
}

// Commented out to avoid unused function warning
// Uncomment and use if you need to clear existing data before seeding
// async function clearExistingData() {
//   console.log('🗑️  Clearing existing seed data...')
//
//   // Delete existing stories and scripts
//   const { error: storiesError } = await supabase
//     .from('stories')
//     .delete()
//     .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
//
//   if (storiesError && storiesError.code !== 'PGRST116') { // PGRST116 = no rows to delete
//     console.error('❌ Error clearing stories:', storiesError)
//   }
//
//   const { error: scriptsError } = await supabase
//     .from('regulation_scripts')
//     .delete()
//     .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
//
//   if (scriptsError && scriptsError.code !== 'PGRST116') {
//     console.error('❌ Error clearing scripts:', scriptsError)
//   }
//
//   console.log('✅ Cleared existing data')
// }

async function verifyData() {
  console.log('🔍 Verifying seeded data...')

  const { count: storyCount, error: storyError } = await supabase
    .from('stories')
    .select('*', { count: 'exact', head: true })

  const { count: scriptCount, error: scriptError } = await supabase
    .from('regulation_scripts')
    .select('*', { count: 'exact', head: true })

  if (storyError || scriptError) {
    console.error('❌ Error verifying data:', storyError || scriptError)
    throw storyError || scriptError
  }

  console.log(`✅ Verification complete:`)
  console.log(`   - Stories: ${storyCount}`)
  console.log(`   - Regulation Scripts: ${scriptCount}`)
}

async function main() {
  try {
    console.log('🚀 Starting database seed...\n')

    // Optional: Clear existing data (comment out to preserve existing records)
    // await clearExistingData()

    // Seed data
    await seedStories()
    await seedRegulationScripts()

    // Verify
    await verifyData()

    console.log('\n🎉 Database seed completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Database seed failed:', error)
    process.exit(1)
  }
}

main()
