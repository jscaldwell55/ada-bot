import { config } from 'dotenv';

console.log('🔍 Starting debug...\n');

// Load environment variables
const result = config({ path: '.env.local' });

console.log('1. dotenv result:', result.error ? result.error : 'SUCCESS');
console.log('2. .env.local exists:', require('fs').existsSync('.env.local'));

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('3. NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ EXISTS' : '❌ MISSING');
console.log('4. SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ EXISTS' : '❌ MISSING');

if (supabaseUrl) {
  console.log('   URL value:', supabaseUrl);
  console.log('   Is localhost:', supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'));
}

if (supabaseServiceKey) {
  console.log('   Key starts with:', supabaseServiceKey.substring(0, 20));
  console.log('   Key length:', supabaseServiceKey.length);
}

console.log('\n✅ Debug complete');