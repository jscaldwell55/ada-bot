'use client'

/**
 * Supabase Provider
 * React Context provider for Supabase client with useSupabase hook
 */

import { createContext, useContext, useMemo } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type SupabaseContext = {
  supabase: SupabaseClient<Database>
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createBrowserClient(), [])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = useContext(Context)

  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }

  return context.supabase
}
