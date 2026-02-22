'use client'

import { useRouter } from 'next/navigation'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import SidebarPageContainer from '@/components/layout/SidebarPageContainer'
import NavbarPageContainer from '@/components/layout/NavbarPageContainer'
import { createLoginHandler, createSignOutHandler } from '@/utils/auth-navigation'
import { useAuth } from '@/hooks/useAuth'

/**
 * Shared layout for public routes (browse, explore).
 *
 * Persists across page transitions within this route group,
 * eliminating navigation remounts and auth flash.
 *
 * Reads auth state from context (instant, no loading state).
 * Renders Sidebar for authenticated users, Navbar for guests.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, setUser } = useAuth()
  const handleLogin = createLoginHandler(router)
  const handleSignOut = createSignOutHandler(router, setUser)

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

  return (
    <div className="min-h-screen bg-grey-50">
      <Navbar onLogin={handleLogin} />
      <NavbarPageContainer>
        {children}
      </NavbarPageContainer>
    </div>
  )
}
