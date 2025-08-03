'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'
import type { User } from '@supabase/supabase-js'

/**
 * Home Page Component
 * 
 * This is the landing page for Slab Advisor.
 * Behavior:
 * - Shows landing page to unauthenticated users with CTA to signup
 * - Automatically redirects authenticated users to /dashboard
 * - Handles OAuth callback errors from URL parameters
 * - Handles loading states during authentication checks
 * 
 * Flow:
 * 1. On mount, check if user is already authenticated
 * 2. If authenticated -> redirect to dashboard
 * 3. If not authenticated -> show landing page with signup CTA
 * 4. If OAuth error present -> redirect to auth page with error
 */

function HomeContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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
   * Handle navigation to auth page
   * Used for both Get Started and Login buttons
   */
  const handleAuthNavigation = () => {
    router.push('/auth')
  }

  // Show loading spinner while checking authentication OR while redirecting authenticated users
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Unauthenticated state: Show landing page
  return <LandingPage onGetStarted={handleAuthNavigation} onLogin={handleAuthNavigation} />
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
