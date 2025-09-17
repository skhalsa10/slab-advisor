'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import QuickAddModal from '@/components/search/QuickAddModal'
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
    isExiting?: boolean
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
    setNotification({ type: 'success', message, isExiting: false })
    
    // Start exit animation after 3 seconds
    const exitTimer = setTimeout(() => {
      setNotification(prev => prev ? { ...prev, isExiting: true } : null)
      
      // Remove notification completely after animation
      setTimeout(() => setNotification(null), 300)
    }, 3000)
    
    return () => clearTimeout(exitTimer)
  }, [])

  const handleAddError = useCallback((message: string) => {
    setNotification({ type: 'error', message, isExiting: false })
    
    // Error notifications stay longer (5 seconds)
    const exitTimer = setTimeout(() => {
      setNotification(prev => prev ? { ...prev, isExiting: true } : null)
      setTimeout(() => setNotification(null), 300)
    }, 5000)
    
    return () => clearTimeout(exitTimer)
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
      <QuickAddModal
        isOpen={isOpen}
        onClose={closeQuickAdd}
        title="Quick Add Card"
      >
        <div className="relative h-full flex flex-col">
          {/* Main Content */}
          <div className="flex-1 relative">
            {/* Notification Toast - Sticky to Top of Scrollable Area */}
            {notification && (
              <div 
                className={`
                  sticky top-0 z-30 mx-4 mt-4 pointer-events-auto
                  transform transition-all duration-300 ease-out
                  ${notification.isExiting 
                    ? 'translate-y-[-120%] opacity-0' 
                    : 'translate-y-0 opacity-100'}
                `}
                style={{
                  animation: notification.isExiting ? 'none' : 'slideDown 0.3s ease-out'
                }}
              >
              <div className={`
                relative overflow-hidden rounded-lg shadow-lg
                ${notification.type === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                  : 'bg-gradient-to-r from-red-500 to-red-600'}
              `}>
                {/* Progress bar for auto-dismiss */}
                {notification.type === 'success' && !notification.isExiting && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                    style={{
                      animation: 'shrinkWidth 3s linear forwards'
                    }}
                  />
                )}
                
                <div className="relative px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-white">
                      {notification.type === 'success' ? (
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 mr-3">
                          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">
                          {notification.type === 'success' ? 'Success!' : 'Error'}
                        </p>
                        <p className="text-white/90 text-sm">{notification.message}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setNotification(prev => prev ? { ...prev, isExiting: true } : null)
                        setTimeout(() => setNotification(null), 300)
                      }}
                      className="text-white/80 hover:text-white ml-4 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                </div>
              </div>
            )}
            
            <QuickAddContent
              onAddSuccess={handleAddSuccess}
              onAddError={handleAddError}
            />
          </div>
          
        </div>
      </QuickAddModal>
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