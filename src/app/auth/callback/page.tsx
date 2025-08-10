'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingScreen from '@/components/ui/LoadingScreen'

/**
 * OAuth Authentication Callback Page
 * 
 * This page is the landing destination for OAuth/Social authentication flows
 * (Google, GitHub, etc.). It's where external providers redirect users back
 * to your app after they authorize access.
 * 
 * OAuth Flow:
 * 1. User clicks "Sign in with Google" on your app
 * 2. User gets redirected to Google's authorization page
 * 3. User authorizes your app on Google
 * 4. Google redirects back to this page: /auth/callback
 * 5. This page processes the authentication result
 * 6. User gets redirected to appropriate page based on redirect parameter
 * 
 * Key Responsibilities:
 * - Extract and validate the OAuth session from Supabase
 * - Handle authentication errors gracefully
 * - Route users to appropriate next page with redirect parameter
 * 
 * Note: Credit initialization is now handled automatically by database trigger
 * when new users are created in auth.users table.
 */
function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session data from the OAuth redirect
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          // OAuth failed - redirect to auth page with error parameter (preserve redirect)
          const errorUrl = redirectTo !== '/dashboard' 
            ? `/auth?error=auth_error&redirect=${encodeURIComponent(redirectTo)}`
            : '/auth?error=auth_error'
          router.push(errorUrl)
          return
        }

        if (data.session?.user) {
          // OAuth succeeded - credits are automatically created by database trigger
          // No client-side credit creation needed (and blocked by RLS policies)
          
          // Redirect to the intended destination
          router.push(redirectTo)
        } else {
          // OAuth succeeded but no session - this shouldn't happen
          const errorUrl = redirectTo !== '/dashboard'
            ? `/auth?error=no_session&redirect=${encodeURIComponent(redirectTo)}`
            : '/auth?error=no_session'
          router.push(errorUrl)
        }
      } catch {
        // Any unexpected error during callback processing
        const errorUrl = redirectTo !== '/dashboard'
          ? `/auth?error=callback_error&redirect=${encodeURIComponent(redirectTo)}`
          : '/auth?error=callback_error'
        router.push(errorUrl)
      }
    }

    handleAuthCallback()
  }, [router, redirectTo])

  // Show loading state while processing OAuth callback
  return <LoadingScreen message="Completing authentication..." />
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <AuthCallbackContent />
    </Suspense>
  )
}