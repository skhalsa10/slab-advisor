'use client'

import { useEffect } from 'react'
import AppNavigation from '@/components/layout/AppNavigation'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Card detail page error:', error)
  }, [error])

  return (
    <AppNavigation>
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-grey-900 mb-2">Something went wrong!</h2>
        <p className="text-sm text-grey-600 mb-6">
          We encountered an error while loading this card. Please try again.
        </p>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/browse/pokemon"
            className="px-4 py-2 border border-grey-300 text-grey-700 rounded-md hover:bg-grey-50 transition-colors"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    </AppNavigation>
  )
}