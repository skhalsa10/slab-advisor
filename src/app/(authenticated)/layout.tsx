'use client'

import { useRouter } from 'next/navigation'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import SidebarPageContainer from '@/components/layout/SidebarPageContainer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { createSignOutHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { loading, setUser } = useAuth({ redirectOnNoAuth: true })
  const handleSignOut = createSignOutHandler(router, setUser)

  if (loading) {
    return <LoadingScreen background="white" />
  }

  // User is guaranteed to exist here due to redirectOnNoAuth: true
  // Note: QuickAddProvider is now handled at the root level
  return (
    <ErrorBoundary>
      <CreditsProvider>
        <div className="h-screen bg-grey-50">
          <Sidebar onSignOut={handleSignOut} />
          <SidebarPageContainer>
            {children}
          </SidebarPageContainer>
        </div>
      </CreditsProvider>
    </ErrorBoundary>
  )
}