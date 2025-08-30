'use client'

import { useEffect } from 'react'

interface CollectionErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Collection Error Boundary Component
 * 
 * Handles errors that occur during collection data loading or rendering.
 * Provides user-friendly error messages and retry functionality.
 */
export default function CollectionError({ error, reset }: CollectionErrorProps) {
  useEffect(() => {
    // Log the error for debugging purposes
    console.error('Collection page error:', error)
  }, [error])

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      
      <h3 className="text-lg font-medium text-grey-900 mb-2">Error Loading Collection</h3>
      
      <p className="text-sm text-grey-600 mb-4">
        {error.message === 'User not authenticated' 
          ? 'Please sign in to view your collection.'
          : 'Unable to load your collection. Please try again.'
        }
      </p>
      
      <button
        onClick={reset}
        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}