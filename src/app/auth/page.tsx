'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage, ERROR_CONTEXT } from '@/utils/error-utils'
import AuthForm from '@/components/auth/AuthForm'
import type { User } from '@supabase/supabase-js'

/**
 * Authentication Page
 * 
 * Dedicated page for user authentication (login/signup).
 * Redirects authenticated users to dashboard.
 * Handles OAuth callback errors from URL parameters.
 */

function AuthContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for OAuth callback errors in URL parameters
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      const errorMessage = getErrorMessage(errorParam, ERROR_CONTEXT.AUTH)
      setError(errorMessage)
      
      // Clear the error parameter from URL without page reload
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

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

  // Show authentication form
  return <AuthForm onSuccess={handleAuthSuccess} initialError={error} />
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  )
}