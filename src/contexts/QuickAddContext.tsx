'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import QuickView from '@/components/ui/QuickView'
import QuickAddContent from '@/components/search/QuickAddContent'

interface QuickAddContextValue {
  isOpen: boolean
  openQuickAdd: () => void
  closeQuickAdd: () => void
}

const QuickAddContext = createContext<QuickAddContextValue | undefined>(undefined)

interface QuickAddProviderProps {
  children: React.ReactNode
}

/**
 * QuickAddProvider Component
 * 
 * Provides global state management for the Quick Add feature.
 * Makes Quick Add accessible from anywhere in the authenticated app.
 * Manages the QuickView modal state and provides context for triggering it.
 * 
 * Should be placed at the layout level to be accessible throughout the app.
 */
export function QuickAddProvider({ children }: QuickAddProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const openQuickAdd = useCallback(() => {
    setIsOpen(true)
    // Clear any existing notifications when opening
    setNotification(null)
  }, [])

  const closeQuickAdd = useCallback(() => {
    setIsOpen(false)
    // Clear notifications when closing
    setTimeout(() => setNotification(null), 300) // Delay to allow modal close animation
  }, [])

  const handleAddSuccess = useCallback((message: string) => {
    setNotification({ type: 'success', message })
    // Auto-hide success notification after 3 seconds
    setTimeout(() => setNotification(null), 3000)
  }, [])

  const handleAddError = useCallback((message: string) => {
    setNotification({ type: 'error', message })
    // Keep error notifications until manually cleared or modal closed
  }, [])

  const contextValue: QuickAddContextValue = {
    isOpen,
    openQuickAdd,
    closeQuickAdd
  }

  return (
    <QuickAddContext.Provider value={contextValue}>
      {children}
      
      {/* Global Quick Add Modal */}
      <QuickView
        isOpen={isOpen}
        onClose={closeQuickAdd}
        title="Quick Add Card"
        preferredLayout="auto"
        loading={false}
        error={null}
      >
        <div className="relative">
          {/* Notification Bar */}
          {notification && (
            <div className={`absolute top-0 left-0 right-0 z-10 mx-4 mt-4 p-3 rounded-md text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {notification.type === 'success' ? (
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {notification.message}
                </div>
                <button
                  onClick={() => setNotification(null)}
                  className="text-current hover:opacity-70 ml-4"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* Main Content */}
          <div className={notification ? 'pt-16' : ''}>
            <QuickAddContent
              onAddSuccess={handleAddSuccess}
              onAddError={handleAddError}
            />
          </div>
        </div>
      </QuickView>
    </QuickAddContext.Provider>
  )
}

/**
 * Hook to access Quick Add context
 * 
 * Provides access to Quick Add modal state and controls.
 * Must be used within a QuickAddProvider.
 * 
 * @returns QuickAdd context value with state and controls
 * @throws Error if used outside of QuickAddProvider
 * 
 * @example
 * ```typescript
 * const { isOpen, openQuickAdd, closeQuickAdd } = useQuickAddContext()
 * 
 * // Trigger Quick Add from anywhere
 * <button onClick={openQuickAdd}>Quick Add Card</button>
 * ```
 */
export function useQuickAddContext(): QuickAddContextValue {
  const context = useContext(QuickAddContext)
  
  if (context === undefined) {
    throw new Error('useQuickAddContext must be used within a QuickAddProvider')
  }
  
  return context
}