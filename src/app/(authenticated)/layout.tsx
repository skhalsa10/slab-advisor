'use client'

import { useRouter } from 'next/navigation'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import SidebarPageContainer from '@/components/layout/SidebarPageContainer'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { createSignOutHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, setUser } = useAuth({ redirectOnNoAuth: true })
  const handleSignOut = createSignOutHandler(router, setUser)

  // Auth is instant from context (loading always false).
  // Middleware handles both auth + profile check server-side.
  // If user is null after logout (onAuthStateChange SIGNED_OUT),
  // redirectOnNoAuth triggers redirect — render nothing while that happens.
  if (!user) {
    return null
  }

  return (
    <ErrorBoundary>
      <CreditsProvider>
        <div className="h-screen bg-background overflow-hidden">
          <Sidebar onSignOut={handleSignOut} />
          <SidebarPageContainer>
            {children}
          </SidebarPageContainer>
        </div>
      </CreditsProvider>
    </ErrorBoundary>
  )
}
