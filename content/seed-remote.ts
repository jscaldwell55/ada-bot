// Alternative: Move variables inside main() function
async function main() {
  // Get and validate environment variables inside the async function
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log('❌ Missing required environment variables');
    console.log('\nRequired in .env.local:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('\nGet these from: Supabase Dashboard → Settings → API');
    process.exit(1);
  }

  // Now TypeScript knows these are strings
  try {
    console.log(`📍 Target database: ${url}`);
    console.log(`🔑 Using service role key: ${key.substring(0, 20)}...`);
    console.log('\n⏳ Starting in 3 seconds... (Press Ctrl+C to cancel)\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🚀 Starting remote database seed...\n')

    // Rest of the function...
  } catch (error) {
    console.error('\n❌ Database seed failed:', error)
    process.exit(1)
  }
}