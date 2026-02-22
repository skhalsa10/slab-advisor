import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { useAuthState } from '@/contexts/AuthStateContext'
import type { User } from '@supabase/supabase-js'

interface UseAuthOptions {
  /** Redirect to home page if user is not authenticated */
  redirectOnNoAuth?: boolean
  /** Redirect to dashboard if user is authenticated */
  redirectOnAuth?: boolean
  /** Custom redirect URL when authenticated (overrides redirectOnAuth) */
  redirectOnAuthTo?: string
  /** Custom redirect URL when not authenticated (overrides redirectOnNoAuth) */
  redirectOnNoAuthTo?: string
}

interface UseAuthReturn {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
}

/**
 * Custom hook for authentication state management
 *
 * Reads from AuthStateContext first (instant, no loading state) when available.
 * Falls back to async getCurrentUser() call only if context is not available.
 *
 * @param options - Configuration options for redirect behavior
 * @returns Authentication state and setter
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const authState = useAuthState()
  const hasContext = !!authState

  const [user, setUserState] = useState<User | null>(authState?.user ?? null)
  const [loading, setLoading] = useState(!hasContext)
  const router = useRouter()

  const {
    redirectOnNoAuth = false,
    redirectOnAuth = false,
    redirectOnAuthTo,
    redirectOnNoAuthTo = '/'
  } = options

  // Keep local state in sync with context changes (login/logout from another tab)
  useEffect(() => {
    if (authState) {
      setUserState(authState.user)
    }
  }, [authState, authState?.user])

  // Fallback: only do async fetch if context is NOT available
  useEffect(() => {
    if (hasContext) return

    getCurrentUser()
      .then((fetchedUser) => {
        setUserState(fetchedUser)

        if (fetchedUser && (redirectOnAuth || redirectOnAuthTo)) {
          router.push(redirectOnAuthTo || '/dashboard')
        } else if (!fetchedUser && redirectOnNoAuth) {
          router.push(redirectOnNoAuthTo)
        }

        setLoading(false)
      })
      .catch(() => {
        setUserState(null)
        if (redirectOnNoAuth) {
          router.push(redirectOnNoAuthTo)
        }
        setLoading(false)
      })
  }, [hasContext, router, redirectOnAuth, redirectOnAuthTo, redirectOnNoAuth, redirectOnNoAuthTo])

  // Handle redirect logic when using context (synchronous path)
  useEffect(() => {
    if (!hasContext) return

    const contextUser = authState?.user ?? null
    if (contextUser && (redirectOnAuth || redirectOnAuthTo)) {
      router.push(redirectOnAuthTo || '/dashboard')
    } else if (!contextUser && redirectOnNoAuth) {
      router.push(redirectOnNoAuthTo)
    }
  }, [hasContext, authState?.user, router, redirectOnAuth, redirectOnAuthTo, redirectOnNoAuth, redirectOnNoAuthTo])

  // Propagate setUser to both local state and context
  const setUser = useCallback((newUser: User | null) => {
    if (authState) {
      authState.setUser(newUser)
    }
    setUserState(newUser)
  }, [authState])

  return { user, loading, setUser }
}
