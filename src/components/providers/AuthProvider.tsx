'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { setupAuthListener } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { identifyUser, resetUser } from '@/lib/posthog/utils'

interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * AuthProvider Component
 *
 * Sets up global auth state listener for better session management.
 * This listener helps track auth state changes, token refreshes,
 * and provides better debugging for auth issues.
 *
 * Also handles user identification for observability tools on auth state changes:
 * - PostHog: Analytics user identification
 * - Sentry: Error tracking user context
 *
 * Should be placed at the root level of the application.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting up auth listener...')
    }

    const { data: { subscription } } = setupAuthListener()

    // Set up PostHog and Sentry identification listener
    const { data: { subscription: observabilitySubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Identify user in PostHog
          identifyUser(session.user.id, {
            email: session.user.email,
            created_at: session.user.created_at,
          })
          // Identify user in Sentry for error tracking
          Sentry.setUser({
            id: session.user.id,
            email: session.user.email,
          })
        } else if (event === 'SIGNED_OUT') {
          // Reset PostHog user on logout
          resetUser()
          // Clear Sentry user context on logout
          Sentry.setUser(null)
        }
      }
    )

    // Clean up listeners on unmount
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleaning up auth listener')
      }
      subscription.unsubscribe()
      observabilitySubscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}