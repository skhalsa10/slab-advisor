'use client'

import { useEffect } from 'react'
import { setupAuthListener } from '@/lib/auth'

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
 * Should be placed at the root level of the application.
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Setting up auth listener...')
    }

    const { data: { subscription } } = setupAuthListener()

    // Clean up listener on unmount
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleaning up auth listener')
      }
      subscription.unsubscribe()
    }
  }, [])

  return <>{children}</>
}