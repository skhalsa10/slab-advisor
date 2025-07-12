'use client'

import { useState } from 'react'
import Image from 'next/image'
import { signOut } from '@/lib/auth'
import { useCredits } from '@/contexts/CreditsContext'

interface HeaderProps {
  onSignOut: () => void
}

export default function Header({ onSignOut }: HeaderProps) {
  const { user, credits, refreshCredits } = useCredits()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    await refreshCredits() // Refresh to clear user state
    onSignOut()
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Image src="/logo-icon.svg" alt="Slab Advisor" className="h-8 w-8 sm:h-10 sm:w-10" width={40} height={40} />
            <h1 className="text-xl sm:text-2xl font-bold">
              <span className="text-grey-900">Slab</span>
              <span className="text-orange-500">Advisor</span>
            </h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center space-x-4">
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

          {/* Mobile Menu Button */}
          {user && (
            <div className="flex sm:hidden items-center space-x-2">
              {/* Credits Badge */}
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                {credits}
              </span>
              
              {/* Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-grey-600 hover:text-grey-900 hover:bg-grey-100"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {user && mobileMenuOpen && (
          <div className="sm:hidden py-3 border-t border-grey-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-600">Signed in as:</span>
                <span className="text-sm font-medium text-grey-900 truncate max-w-[200px]">
                  {user.email}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-grey-600">Credits remaining:</span>
                <span className="text-sm font-medium text-grey-900">{credits}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full text-left text-sm text-orange-600 hover:text-orange-500 py-2 border-t border-grey-200"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}