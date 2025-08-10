'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { createLoginHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'

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
  const router = useRouter()
  const { user, loading } = useAuth({ redirectOnAuth: true })
  const handleAuthNavigation = createLoginHandler(router)

  // Show loading spinner while checking authentication OR while redirecting authenticated users
  if (loading || user) {
    return <LoadingScreen background="white" />
  }

  // Unauthenticated state: Show landing page
  return <LandingPage onGetStarted={handleAuthNavigation} onLogin={handleAuthNavigation} />
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen background="white" />}>
      <HomeContent />
    </Suspense>
  )
}
