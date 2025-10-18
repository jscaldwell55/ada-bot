/**
 * Verification Script for Regulation Scripts
 * Checks that scripts have correct durations and step counts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables')
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function verifyScripts() {
  console.log('🔍 Verifying regulation scripts in database...\n')

  const { data: scripts, error } = await supabase
    .from('regulation_scripts')
    .select('*')
    .order('name')

  if (error) {
    console.error('❌ Error fetching scripts:', error)
    throw error
  }

  console.log(`Found ${scripts?.length || 0} scripts:\n`)

  scripts?.forEach((script: any) => {
    const stepCount = Array.isArray(script.steps) ? script.steps.length : 0
    const totalDuration = script.duration_seconds * 1000 // Convert to ms

    console.log(`📋 ${script.name}`)
    console.log(`   ID: ${script.id}`)
    console.log(`   Steps: ${stepCount} (expected: 3-5)`)
    console.log(`   Duration: ${script.duration_seconds}s (${totalDuration}ms)`)
    console.log(`   Expected: 30s (30000ms)`)
    console.log(`   Status: ${script.duration_seconds === 30 && stepCount >= 3 && stepCount <= 5 ? '✅ PASS' : '❌ FAIL'}`)
    console.log('')
  })

  const allValid = scripts?.every((s: any) =>
    s.duration_seconds === 30 &&
    Array.isArray(s.steps) &&
    s.steps.length >= 3 &&
    s.steps.length <= 5
  )

  if (allValid) {
    console.log('🎉 All scripts meet the requirements!')
  } else {
    console.log('⚠️  Some scripts do not meet the requirements')
  }

  process.exit(0)
}

verifyScripts().catch(error => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})
