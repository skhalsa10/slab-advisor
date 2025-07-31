'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/auth'
import { useCredits } from '@/contexts/CreditsContext'

interface SidebarProps {
  onSignOut: () => void
}

export default function Sidebar({ onSignOut }: SidebarProps) {
  const { user, credits, refreshCredits } = useCredits()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
    await refreshCredits() // Refresh to clear user state
    onSignOut()
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Collection', href: '/collection', icon: '🎴' },
    { name: 'Explore', href: '/explore', icon: '🔍' },
  ]

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col h-full bg-white border-r border-grey-200">
          {/* Logo */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-grey-200">
            <Image 
              src="/logo-icon.svg" 
              alt="Slab Advisor" 
              className="h-8 w-8"
              width={32} 
              height={32} 
            />
            <h1 className="ml-3 text-xl font-bold">
              <span className="text-grey-900">Slab</span>
              <span className="text-orange-500">Advisor</span>
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActiveLink(item.href)
                      ? 'bg-orange-50 border-orange-500 text-orange-700'
                      : 'border-transparent text-grey-600 hover:bg-grey-50 hover:text-grey-900'
                  } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* User Info */}
            {user && (
              <div className="flex-shrink-0 border-t border-grey-200 p-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-grey-900 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-grey-600">Credits:</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium font-mono">
                      {credits}
                    </span>
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
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-white shadow-sm border-b border-grey-200">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center">
              <Image 
                src="/logo-icon.svg" 
                alt="Slab Advisor" 
                className="h-8 w-8"
                width={32} 
                height={32} 
              />
              <h1 className="ml-2 text-lg font-bold">
                <span className="text-grey-900">Slab</span>
                <span className="text-orange-500">Advisor</span>
              </h1>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center">
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
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-grey-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActiveLink(item.href)
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-grey-600 hover:bg-grey-50 hover:text-grey-900'
                    } flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
              {user && (
                <div className="border-t border-grey-200 pt-4 pb-3">
                  <div className="px-4 space-y-3">
                    <p className="text-sm text-grey-600">Signed in as:</p>
                    <p className="text-sm font-medium text-grey-900 truncate">
                      {user.email}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-grey-600">Credits:</span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium font-mono">
                        {credits}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left text-sm text-orange-600 hover:text-orange-500 py-2"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}