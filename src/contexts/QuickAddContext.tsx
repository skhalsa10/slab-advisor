'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import QuickAddModal from '@/components/search/QuickAddModal'
import QuickAddContent from '@/components/search/QuickAddContent'
import CameraCapture from '@/components/camera/CameraCapture'
import ScanResultsView from '@/components/search/ScanResultsView'
import { getCurrentUser } from '@/lib/auth'
import { useCardIdentification } from '@/hooks/useCardIdentification'
import { useQuickAdd } from '@/hooks/useQuickAdd'

/**
 * View states for Quick Add modal
 * - choice: Initial view with camera button and search
 * - camera: Full-screen camera capture
 * - identifying: Processing captured image
 * - results: Display identification results
 * - search: Text search view (legacy, same as choice)
 */
export type QuickAddView = 'choice' | 'camera' | 'identifying' | 'results' | 'search'

interface QuickAddContextValue {
  isOpen: boolean
  openQuickAdd: () => void
  closeQuickAdd: () => void
  onCollectionUpdate?: () => void
  setCollectionUpdateCallback: (callback: (() => void) | undefined) => void
  // View state
  currentView: QuickAddView
  setView: (view: QuickAddView) => void
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
 * Implements a 4-state workflow:
 * 1. Choice: User picks camera scan or text search
 * 2. Camera: Full-screen camera viewfinder
 * 3. Identifying: Processing captured image with Ximilar
 * 4. Results: Display matches and add to collection
 *
 * Should be placed at the layout level to be accessible throughout the app.
 */
export function QuickAddProvider({ children }: QuickAddProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentView, setCurrentView] = useState<QuickAddView>('choice')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
    isExiting?: boolean
  } | null>(null)
  const [onCollectionUpdate, setOnCollectionUpdate] = useState<(() => void) | undefined>(undefined)

  // Hooks for identification
  const {
    identifyCard,
    result: identificationResult,
    isIdentifying,
    reset: resetIdentification
  } = useCardIdentification()

  const { addToCollection, addingCardId } = useQuickAdd()

  const openQuickAdd = useCallback(async () => {
    // Check authentication before opening QuickAdd
    try {
      const user = await getCurrentUser()
      if (!user) {
        console.warn('QuickAdd attempted without authentication')
        return
      }

      setIsOpen(true)
      setCurrentView('choice')
      // Clear any existing notifications when opening
      setNotification(null)
      resetIdentification()
    } catch (error) {
      // Handle auth session errors gracefully (e.g., during logout)
      console.warn('QuickAdd auth check failed:', error)
      return
    }
  }, [resetIdentification])

  const closeQuickAdd = useCallback(() => {
    setIsOpen(false)
    // Reset state when closing
    setTimeout(() => {
      setCurrentView('choice')
      setIsSearchFocused(false)
      setNotification(null)
      resetIdentification()
    }, 300) // Delay to allow modal close animation
  }, [resetIdentification])

  const setView = useCallback((view: QuickAddView) => {
    setCurrentView(view)
  }, [])

  const handleAddSuccess = useCallback((message: string) => {
    setNotification({ type: 'success', message, isExiting: false })

    // Trigger collection update if callback is set
    if (onCollectionUpdate) {
      onCollectionUpdate()
    }

    // Start exit animation after 3 seconds
    const exitTimer = setTimeout(() => {
      setNotification(prev => prev ? { ...prev, isExiting: true } : null)

      // Remove notification completely after animation
      setTimeout(() => setNotification(null), 300)
    }, 3000)

    return () => clearTimeout(exitTimer)
  }, [onCollectionUpdate])

  const handleAddError = useCallback((message: string) => {
    setNotification({ type: 'error', message, isExiting: false })

    // Error notifications stay longer (5 seconds)
    const exitTimer = setTimeout(() => {
      setNotification(prev => prev ? { ...prev, isExiting: true } : null)
      setTimeout(() => setNotification(null), 300)
    }, 5000)

    return () => clearTimeout(exitTimer)
  }, [])

  const setCollectionUpdateCallback = useCallback((callback: (() => void) | undefined) => {
    setOnCollectionUpdate(() => callback)
  }, [])

  // Handle camera capture
  const handleCameraCapture = useCallback(async (base64Image: string) => {
    setCurrentView('identifying')
    const result = await identifyCard(base64Image)

    if (result) {
      setCurrentView('results')
    }
  }, [identifyCard])

  // Handle going back to camera from results
  const handleRetry = useCallback(() => {
    resetIdentification()
    setCurrentView('camera')
  }, [resetIdentification])

  // Handle confirming and adding to collection
  const handleConfirmAdd = useCallback(async (
    cardId: string,
    variant: string,
    quantity: number
  ): Promise<boolean> => {
    const success = await addToCollection(cardId, variant, quantity)

    if (success) {
      handleAddSuccess(`Added ${quantity} card(s) to your collection`)
      // Return to camera view after successful add for quick scanning flow
      setTimeout(() => {
        resetIdentification()
        setCurrentView('camera')
      }, 1500)
    } else {
      handleAddError('Failed to add card to collection')
    }

    return success
  }, [addToCollection, handleAddSuccess, handleAddError, resetIdentification])

  const contextValue: QuickAddContextValue = {
    isOpen,
    openQuickAdd,
    closeQuickAdd,
    onCollectionUpdate,
    setCollectionUpdateCallback,
    currentView,
    setView
  }

  // Render camera view as a portal (full-screen overlay)
  const renderCameraView = () => {
    if (currentView !== 'camera' && currentView !== 'identifying') return null

    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setCurrentView('choice')}
        onSearchByText={() => setCurrentView('choice')}
        isProcessing={isIdentifying}
        allowCameraSwitch
      />
    )
  }

  // Notification toast component
  const NotificationToast = () => {
    if (!notification) return null

    return (
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
    )
  }

  return (
    <QuickAddContext.Provider value={contextValue}>
      {children}

      {/* Camera view (rendered as portal, outside modal) */}
      {isOpen && renderCameraView()}

      {/* Global Quick Add Modal */}
      {currentView !== 'camera' && currentView !== 'identifying' && (
        <QuickAddModal
          isOpen={isOpen}
          onClose={closeQuickAdd}
          title="Quick Add Card"
        >
          <div className="relative h-full flex flex-col">
            {/* Main Content */}
            <div className="flex-1 relative">
              {/* Notification Toast */}
              <NotificationToast />

              {/* Choice View - Camera button + Search */}
              {(currentView === 'choice' || currentView === 'search') && (
                <div className="h-full flex flex-col">
                  {/* Camera Scan Button - hide when search is focused */}
                  {!isSearchFocused && (
                    <>
                      <div className="p-4">
                        <button
                          onClick={() => setCurrentView('camera')}
                          className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-semibold">Scan Card with Camera</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4 px-4 py-2">
                        <div className="flex-1 h-px bg-grey-200" />
                        <span className="text-sm text-grey-500">or search by name</span>
                        <div className="flex-1 h-px bg-grey-200" />
                      </div>
                    </>
                  )}

                  {/* Search Content */}
                  <div className="flex-1 overflow-hidden">
                    <QuickAddContent
                      onAddSuccess={handleAddSuccess}
                      onAddError={handleAddError}
                      onFocusChange={setIsSearchFocused}
                      onCameraClick={() => setCurrentView('camera')}
                    />
                  </div>
                </div>
              )}

              {/* Results View */}
              {currentView === 'results' && identificationResult && (
                <ScanResultsView
                  result={identificationResult}
                  onConfirm={handleConfirmAdd}
                  onRetry={handleRetry}
                  onCancel={() => setCurrentView('choice')}
                  isAdding={addingCardId !== null}
                />
              )}
            </div>
          </div>
        </QuickAddModal>
      )}
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
 * const { isOpen, openQuickAdd, closeQuickAdd, setView } = useQuickAddContext()
 *
 * // Trigger Quick Add from anywhere
 * <button onClick={openQuickAdd}>Quick Add Card</button>
 *
 * // Open directly to camera
 * openQuickAdd()
 * setView('camera')
 * ```
 */
export function useQuickAddContext(): QuickAddContextValue {
  const context = useContext(QuickAddContext)

  if (context === undefined) {
    throw new Error('useQuickAddContext must be used within a QuickAddProvider')
  }

  return context
}
