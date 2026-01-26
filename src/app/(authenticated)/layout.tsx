'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import SidebarPageContainer from '@/components/layout/SidebarPageContainer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { createSignOutHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading, setUser } = useAuth({ redirectOnNoAuth: true })
  const [profileChecked, setProfileChecked] = useState(false)
  const handleSignOut = createSignOutHandler(router, setUser)

  // Check if user has a profile/username
  useEffect(() => {
    async function checkProfile() {
      if (!user) return

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', user.id)
          .single()

        if (!profile) {
          // No profile found, redirect to complete-profile
          router.push('/auth/complete-profile')
          return
        }

        setProfileChecked(true)
      } catch (err) {
        console.error('Error checking profile:', err)
        setProfileChecked(true) // Continue anyway to avoid infinite loading
      }
    }

    if (!loading && user) {
      checkProfile()
    }
  }, [user, loading, router])

  if (loading || !profileChecked) {
    return <LoadingScreen background="white" />
  }

  // User is guaranteed to exist here due to redirectOnNoAuth: true
  // User is guaranteed to have a profile due to profile check above
  // Note: QuickAddProvider is now handled at the root level
  return (
    <ErrorBoundary>
      <CreditsProvider>
        <div className="h-screen bg-grey-50 overflow-hidden">
          <Sidebar onSignOut={handleSignOut} />
          <SidebarPageContainer>
            {children}
          </SidebarPageContainer>
        </div>
      </CreditsProvider>
    </ErrorBoundary>
  )
}
