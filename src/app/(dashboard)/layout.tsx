'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { CreditsProvider } from '@/contexts/CreditsContext'
import Sidebar from '@/components/layout/Sidebar'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import type { User } from '@supabase/supabase-js'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getCurrentUser()
      .then((user) => {
        if (user) {
          setUser(user)
        } else {
          router.push('/')
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/')
        setLoading(false)
      })
  }, [router])

  const handleSignOut = () => {
    setUser(null)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <ErrorBoundary>
      <CreditsProvider>
        <div className="h-screen bg-grey-50">
          <Sidebar onSignOut={handleSignOut} />
          
          {/* Main content */}
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
    </ErrorBoundary>
  )
}