'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { signInWithProvider } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

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
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        setLoading(false)
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
      })
  }, [])

  const handleLogin = async () => {
    try {
      await signInWithProvider('google')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grey-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  // Authenticated user - show sidebar layout
  if (user) {
    return (
      <CreditsProvider>
        <div className="h-screen bg-grey-50">
          <Sidebar onSignOut={handleSignOut} />
          
          {/* Main content with sidebar offset */}
          <div className="flex flex-col h-full md:pl-64">
            <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </CreditsProvider>
    )
  }

  // Unauthenticated user - show navbar layout
  return (
    <div className="min-h-screen bg-grey-50">
      <Navbar onLogin={handleLogin} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
        {children}
      </div>
    </div>
  )
}