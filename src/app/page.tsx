'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import AuthForm from '@/components/auth/AuthForm'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

  const handleAuthSuccess = () => {
    getCurrentUser()
      .then((user) => {
        setUser(user)
        if (user) {
          router.push('/dashboard')
        }
      })
      .catch(() => {
        // Auth success but failed to get user - let app retry on next render
      })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (user) {
    // Will redirect in useEffect
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return <AuthForm onSuccess={handleAuthSuccess} />
}
