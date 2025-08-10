'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Props for the Navbar component
 * @property onLogin - Callback function triggered when user clicks "Login"
 */
interface NavbarProps {
  onLogin: () => void
}

/**
 * Navbar Component
 * 
 * Navigation bar for the landing page that provides:
 * - Brand logo/name on the left
 * - Navigation links (Explore, Login) on the right
 * - Responsive design with mobile hamburger menu
 * - Consistent styling with the app's orange theme
 */
export default function Navbar({ onLogin }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="bg-white shadow-sm border-b border-grey-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Slab Advisor Logo"
                width={200}
                height={50}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/explore"
                className="text-grey-600 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Explore
              </Link>
              <button
                onClick={onLogin}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Login
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="bg-grey-100 inline-flex items-center justify-center p-2 rounded-md text-grey-400 hover:text-grey-500 hover:bg-grey-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset transition-colors"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-grey-200 shadow-lg">
            <Link
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-grey-600 hover:text-orange-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Explore
            </Link>
            <button
              onClick={() => {
                onLogin()
                setIsMobileMenuOpen(false)
              }}
              className="w-full text-left bg-orange-600 hover:bg-orange-700 text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}