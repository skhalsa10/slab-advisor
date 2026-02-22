'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthStateContextType {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
}

const AuthStateContext = createContext<AuthStateContextType | undefined>(undefined)

interface AuthStateProviderProps {
  /** User from server-side auth check. Pass null for unauthenticated. */
  initialUser: User | null
  children: React.ReactNode
}

/**
 * Shared auth state provider that eliminates redundant client-side auth checks.
 *
 * The `initialUser` is determined server-side (via `getUser()` in page.tsx),
 * so the auth state is available immediately on first render — no async call,
 * no loading flash.
 *
 * Listens to `onAuthStateChange` to stay in sync with logout, token refresh, etc.
 */
export function AuthStateProvider({ initialUser, children }: AuthStateProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  // Server already resolved auth — no loading state needed
  const [loading] = useState(false)

  // Listen for auth state changes (logout, token refresh, sign-in from another tab)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSetUser = useCallback((newUser: User | null) => {
    setUser(newUser)
  }, [])

  return (
    <AuthStateContext.Provider value={{ user, loading, setUser: handleSetUser }}>
      {children}
    </AuthStateContext.Provider>
  )
}

/**
 * Hook to consume the shared auth state context.
 * Returns undefined if not within an AuthStateProvider (allows useAuth fallback).
 */
export function useAuthState(): AuthStateContextType | undefined {
  return useContext(AuthStateContext)
}
