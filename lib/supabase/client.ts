// lib/supabase/client.ts
// Supabase client setup for browser and server

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// ============================================
// BROWSER CLIENT
// ============================================

/**
 * Browser-safe Supabase client
 * Uses anon key and respects Row Level Security (RLS)
 */
export const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

// Singleton instance for browser
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('Browser client should only be used in browser context');
  }
  
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  
  return browserClient;
};

// ============================================
// SERVER CLIENT (for API routes)
// ============================================

/**
 * Server-side Supabase client with service role key
 * CAUTION: Only use in API routes or server components
 * This bypasses Row Level Security
 */
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase server environment variables. Please check SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

// ============================================
// AUTHENTICATION HELPERS
// ============================================

/**
 * Get current user from browser session
 */
export const getCurrentUser = async () => {
  const supabase = getSupabaseBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return user;
};

/**
 * Sign in with email/password
 */
export const signIn = async (email: string, password: string) => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

/**
 * Sign up with email/password
 */
export const signUp = async (email: string, password: string) => {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signOut();
  
  return { error };
};

/**
 * Reset password request
 */
export const resetPassword = async (email: string) => {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  
  return { error };
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * Subscribe to session changes for a child
 * Useful for parent dashboard to see real-time progress
 */
export const subscribeToChildSessions = (
  childId: string,
  callback: (payload: any) => void
) => {
  const supabase = getSupabaseBrowserClient();
  
  const subscription = supabase
    .channel(`child_sessions:${childId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `child_id=eq.${childId}`,
      },
      callback
    )
    .subscribe();
  
  return subscription;
};

/**
 * Subscribe to safety alerts for a child
 */
export const subscribeToSafetyAlerts = (
  childId: string,
  callback: (payload: any) => void
) => {
  const supabase = getSupabaseBrowserClient();
  
  const subscription = supabase
    .channel(`safety_alerts:${childId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'safety_alerts',
        filter: `child_id=eq.${childId}`,
      },
      callback
    )
    .subscribe();
  
  return subscription;
};

// ============================================
// STORAGE HELPERS (for future use)
// ============================================

/**
 * Upload a file to Supabase storage
 * Could be used for child avatars or session recordings
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
) => {
  const supabase = getSupabaseBrowserClient();
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  return { data, error };
};

/**
 * Get public URL for a file
 */
export const getPublicUrl = (bucket: string, path: string) => {
  const supabase = getSupabaseBrowserClient();
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// ============================================
// CONVENIENCE EXPORTS
// ============================================

/**
 * Convenience export for client components
 * Alias for getSupabaseBrowserClient
 */
export const createClient = getSupabaseBrowserClient;

// ============================================
// TYPE EXPORTS (for convenience)
// ============================================

export type SupabaseClient = ReturnType<typeof createBrowserClient>;
export type SupabaseServerClient = ReturnType<typeof createServerClient>;