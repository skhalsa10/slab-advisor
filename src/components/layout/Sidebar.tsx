'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Library, Compass, PlusCircle, Menu, X } from 'lucide-react'
import { signOut } from '@/lib/auth'
import { useCredits } from '@/contexts/CreditsContext'
import { useQuickAddContext } from '@/contexts/QuickAddContext'
import { trackSignOut } from '@/lib/posthog/events'
import SidebarFooter from './SidebarFooter'

interface SidebarProps {
  onSignOut: () => void
}

interface NavigationItem {
  name: string
  href: string
  icon: React.ReactNode
  action?: string
}

export default function Sidebar({ onSignOut }: SidebarProps) {
  const { user, credits, refreshCredits } = useCredits()
  const { openQuickAdd } = useQuickAddContext()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const handleSignOut = async () => {
    trackSignOut() // Track before signOut clears user context
    await signOut()
    await refreshCredits() // Refresh to clear user state
    onSignOut()
  }

  // Navigation items - QuickAdd only shown for authenticated users
  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Collection', href: '/collection', icon: <Library className="h-5 w-5" /> },
    { name: 'Explore', href: '/explore', icon: <Compass className="h-5 w-5" /> },
    ...(user ? [{ name: 'Quick Add', href: '#', icon: <PlusCircle className="h-5 w-5" />, action: 'quickAdd' }] : []),
  ]

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleNavigationClick = (item: NavigationItem) => {
    if (item.action === 'quickAdd') {
      openQuickAdd()
    }
    // For regular links, the Link component handles navigation
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col h-full bg-sidebar">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-sidebar-border">
            <Image
              src="/secondary_logo_dark.png"
              alt="Slab Advisor"
              className="h-12 w-auto"
              width={196}
              height={84}
            />
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                if (item.action === 'quickAdd') {
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigationClick(item)}
                      className="w-full border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors"
                    >
                      <span className="mr-3 text-sidebar-foreground group-hover:text-sidebar-accent-foreground transition-colors">{item.icon}</span>
                      {item.name}
                    </button>
                  )
                }
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActiveLink(item.href)
                        ? 'bg-sidebar-accent border-orange-500 text-orange-400'
                        : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    } group flex items-center px-3 py-2 text-sm font-medium border-l-4 transition-colors`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User Footer */}
            {user && (
              <SidebarFooter
                email={user.email || ''}
                credits={credits}
                onSignOut={handleSignOut}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-sidebar shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Logo */}
            <div className="flex items-center">
              <Image
                src="/secondary_logo_dark.png"
                alt="Slab Advisor"
                className="h-10 w-auto"
                width={196}
                height={84}
              />
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors focus:outline-none"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-sidebar-border bg-sidebar">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => {
                  if (item.action === 'quickAdd') {
                    return (
                      <button
                        key={item.name}
                        onClick={() => {
                          handleNavigationClick(item)
                          setMobileMenuOpen(false)
                        }}
                        className="w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors"
                      >
                        <span className="mr-3 text-sidebar-foreground group-hover:text-sidebar-accent-foreground transition-colors">{item.icon}</span>
                        {item.name}
                      </button>
                    )
                  }
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActiveLink(item.href)
                          ? 'bg-sidebar-accent text-orange-400'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      } flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className={`mr-3 transition-colors ${
                        isActiveLink(item.href) ? 'text-orange-400' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                      }`}>
                        {item.icon}
                      </span>
                      {item.name}
                    </Link>
                  )
                })}
              </div>
              {user && (
                <SidebarFooter
                  email={user.email || ''}
                  credits={credits}
                  onSignOut={handleSignOut}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}