import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const requestUrl = new URL(request.url)
  const supabase = createClient()

  // Sign out the user
  await supabase.auth.signOut()

  // Redirect to home page
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}