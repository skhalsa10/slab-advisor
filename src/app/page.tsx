'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import LandingPage from '@/components/landing/LandingPage'
import WaitlistPage from '@/components/waitlist/WaitlistPage'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { createLoginHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'

/**
 * Home Page Component
 *
 * This is the landing page for Slab Advisor.
 * Behavior:
 * - Waitlist mode: Shows waitlist signup page (middleware blocks all other routes)
 * - Normal mode: Shows landing page to unauthenticated users with CTA to signup
 * - Automatically redirects authenticated users to /dashboard (both modes)
 *
 * Flow:
 * 1. On mount, check if user is already authenticated
 * 2. If authenticated -> redirect to dashboard
 * 3. If waitlist mode -> show waitlist page
 * 4. If not authenticated -> show landing page with signup CTA
 */

function HomeContent() {
  const router = useRouter()
  const { user, loading } = useAuth({ redirectOnAuth: true })
  const handleAuthNavigation = createLoginHandler(router)

  // Show loading spinner while checking authentication OR while redirecting authenticated users
  if (loading || user) {
    return <LoadingScreen background="white" />
  }

  // Waitlist mode: show waitlist page for unauthenticated visitors
  // Bypass users with active sessions are already redirected to dashboard above
  if (process.env.NEXT_PUBLIC_LAUNCH_MODE === 'waitlist') {
    return <WaitlistPage />
  }

  // Normal mode: Show landing page
  return <LandingPage onGetStarted={handleAuthNavigation} onLogin={handleAuthNavigation} />
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen background="white" />}>
      <HomeContent />
    </Suspense>
  )
}
