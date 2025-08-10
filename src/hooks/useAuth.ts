import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
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
 * Handles the common pattern of:
 * - Checking current user on mount
 * - Managing loading state
 * - Optional redirect logic
 * 
 * @param options - Configuration options for redirect behavior
 * @returns Authentication state and setter
 * 
 * @example
 * ```typescript
 * // Basic auth check with loading state
 * const { user, loading } = useAuth()
 * 
 * // Redirect to dashboard if authenticated
 * const { user, loading } = useAuth({ redirectOnAuth: true })
 * 
 * // Redirect to home if not authenticated
 * const { user, loading } = useAuth({ redirectOnNoAuth: true })
 * 
 * // Custom redirects
 * const { user, loading } = useAuth({ 
 *   redirectOnAuthTo: '/dashboard',
 *   redirectOnNoAuthTo: '/' 
 * })
 * ```
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const {
    redirectOnNoAuth = false,
    redirectOnAuth = false,
    redirectOnAuthTo,
    redirectOnNoAuthTo = '/'
  } = options

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        
        // Handle redirect logic
        if (user && (redirectOnAuth || redirectOnAuthTo)) {
          const redirectUrl = redirectOnAuthTo || '/dashboard'
          router.push(redirectUrl)
        } else if (!user && redirectOnNoAuth) {
          router.push(redirectOnNoAuthTo)
        }
        
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        
        // Redirect on auth check failure
        if (redirectOnNoAuth) {
          router.push(redirectOnNoAuthTo)
        }
        
        setLoading(false)
      })
  }, [router, redirectOnAuth, redirectOnAuthTo, redirectOnNoAuth, redirectOnNoAuthTo])

  return { user, loading, setUser }
}