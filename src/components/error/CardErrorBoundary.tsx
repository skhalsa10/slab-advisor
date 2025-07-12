'use client'

import React from 'react'
import { ErrorBoundary } from './ErrorBoundary'

interface CardErrorFallbackProps {
  onRetry?: () => void
  title?: string
  message?: string
}

function CardErrorFallback({ 
  onRetry, 
  title = "Card operation failed",
  message = "There was an issue processing your card. This might be due to image quality or connectivity issues."
}: CardErrorFallbackProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-red-200">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-grey-900 mb-2">
          {title}
        </h3>
        <p className="text-grey-600 mb-4">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 border border-orange-300 text-orange-700 text-sm font-medium rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}

interface CardErrorBoundaryProps {
  children: React.ReactNode
  onRetry?: () => void
  title?: string
  message?: string
}

export function CardErrorBoundary({ children, onRetry, title, message }: CardErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={
        <CardErrorFallback 
          onRetry={onRetry}
          title={title}
          message={message}
        />
      }
    >
      {children}
    </ErrorBoundary>
  )
}