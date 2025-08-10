'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage, ERROR_CONTEXT } from '@/utils/error-utils'
import AuthForm from '@/components/auth/AuthForm'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/hooks/useAuth'

/**
 * Authentication Page
 * 
 * Dedicated page for user authentication (login/signup).
 * Redirects authenticated users to dashboard.
 * Handles OAuth callback errors from URL parameters.
 */

function AuthContent() {
  const [error, setError] = useState<string | undefined>(undefined)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get redirect URL from search params, default to dashboard
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  
  // Use custom auth hook with redirect
  const { user, loading, setUser } = useAuth({ 
    redirectOnAuthTo: redirectTo 
  })

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

  /**
   * Handle successful authentication
   * Called by AuthForm when user successfully logs in or signs up
   */
  const handleAuthSuccess = () => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        if (user) {
          router.push(redirectTo)
        }
      })
      .catch(() => {
        // Auth success but failed to get user - let app retry on next render
      })
  }

  // Show loading spinner while checking authentication OR while redirecting authenticated users
  if (loading || user) {
    return <LoadingScreen background="white" />
  }

  // Show authentication form
  return <AuthForm onSuccess={handleAuthSuccess} initialError={error} />
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingScreen background="white" />}>
      <AuthContent />
    </Suspense>
  )
}