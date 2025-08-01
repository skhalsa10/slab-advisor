'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AuthForm from '@/components/auth/AuthForm'
import type { User } from '@supabase/supabase-js'

/**
 * Home Page Component
 * 
 * This is the landing page and authentication gateway for Slab Advisor.
 * Behavior:
 * - Shows authentication form to unauthenticated users
 * - Automatically redirects authenticated users to /dashboard
 * - Handles loading states during authentication checks
 * 
 * Flow:
 * 1. On mount, check if user is already authenticated
 * 2. If authenticated -> redirect to dashboard
 * 3. If not authenticated -> show login/signup form
 * 4. After successful auth -> redirect to dashboard
 */
export default function Home() {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // Start with loading to check auth
  const router = useRouter()

  // Check authentication status on component mount
  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        if (user) {
          // Redirect authenticated users to dashboard
          router.push('/dashboard')
        }
        setLoading(false)
      })
      .catch(() => {
        // Handle authentication error silently - user will see login form
        setLoading(false)
      })
  }, [router])

  /**
   * Handle successful authentication
   * Called by AuthForm when user successfully logs in or signs up
   */
  const handleAuthSuccess = () => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        if (user) {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        // Auth success but failed to get user - let app retry on next render
      })
  }

  // Show loading spinner while checking authentication OR while redirecting authenticated users
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Unauthenticated state: Show authentication form
  //TODO: convert this to a landing page with a signup button
  return <AuthForm onSuccess={handleAuthSuccess} />
}
