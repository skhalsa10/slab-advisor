'use client'

import { useState, useEffect } from 'react'
import { signOut, getCurrentUser, getUserCredits } from '@/lib/auth'
import type { User } from '@supabase/supabase-js'

interface HeaderProps {
  onSignOut: () => void
}

export default function Header({ onSignOut }: HeaderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    getCurrentUser().then(setUser).catch(console.error)
  }, [])

  useEffect(() => {
    if (user) {
      getUserCredits(user.id).then(setCredits).catch(console.error)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    onSignOut()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <img src="/logo-icon.svg" alt="Slab Advisor" className="h-10 w-10" />
            <h1 className="text-2xl font-bold">
              <span className="text-grey-900">Slab</span>
              <span className="text-orange-500">Advisor</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-grey-600">Credits:</span>
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium">
                    {credits}
                  </span>
                </div>
                <span className="text-sm text-grey-600">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-orange-600 hover:text-orange-500"
                >
                  Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}