'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
 * 6. User gets redirected to home page, which handles final routing
 * 
 * Key Responsibilities:
 * - Extract and validate the OAuth session from Supabase
 * - Handle authentication errors gracefully
 * - Route users to appropriate next page
 * 
 * Note: Credit initialization is now handled automatically by database trigger
 * when new users are created in auth.users table.
 */
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    /**
     * Process OAuth callback and set up user account
     */
    const handleAuthCallback = async () => {
      try {
        // Get the session data from the OAuth redirect
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          // OAuth failed - redirect to home with error parameter
          router.push('/?error=auth_error')
          return
        }

        if (data.session?.user) {
          // OAuth succeeded - credits are automatically created by database trigger
          // No client-side credit creation needed (and blocked by RLS policies)
          
          // Redirect to home page, which will handle authenticated user routing
          router.push('/')
        } else {
          // OAuth succeeded but no session - this shouldn't happen
          router.push('/?error=no_session')
        }
      } catch {
        // Any unexpected error during callback processing
        router.push('/?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  // Show loading state while processing OAuth callback
  return (
    <div className="min-h-screen flex items-center justify-center bg-grey-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-grey-600">Completing authentication...</p>
      </div>
    </div>
  )
}