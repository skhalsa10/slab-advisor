'use client'

import { useRouter } from 'next/navigation'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import SidebarPageContainer from '@/components/layout/SidebarPageContainer'
import NavbarPageContainer from '@/components/layout/NavbarPageContainer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import { createLoginHandler, createSignOutHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'

interface AppNavigationProps {
  children: React.ReactNode
}

/**
 * Smart navigation component that renders either:
 * - Navbar (for unauthenticated users)
 * - Sidebar (for authenticated users)
 * 
 * Also provides the appropriate layout wrapper and context providers.
 */
export default function AppNavigation({ children }: AppNavigationProps) {
  const router = useRouter()
  const { user, loading, setUser } = useAuth()
  const handleLogin = createLoginHandler(router)
  const handleSignOut = createSignOutHandler(router, setUser)

  if (loading) {
    return <LoadingScreen />
  }

  // Authenticated user - show sidebar layout
  // Note: QuickAddProvider is now handled at the root level
  if (user) {
    return (
      <CreditsProvider>
        <div className="h-screen bg-grey-50">
          <Sidebar onSignOut={handleSignOut} />
          <SidebarPageContainer>
            {children}
          </SidebarPageContainer>
        </div>
      </CreditsProvider>
    )
  }

  // Unauthenticated user - show navbar layout
  return (
    <div className="min-h-screen bg-grey-50">
      <Navbar onLogin={handleLogin} />
      <NavbarPageContainer>
        {children}
      </NavbarPageContainer>
    </div>
  )
}