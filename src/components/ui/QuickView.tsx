'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useBreakpoint } from '@/hooks/useIsDesktop'
import { calculateAdjacentCards, type AdjacentCards } from '@/utils/card-navigation'

export type QuickViewLayout = 'modal' | 'sidesheet' | 'bottomsheet' | 'auto'
export type QuickViewLayoutResolved = 'modal' | 'sidesheet' | 'bottomsheet'

// Context to provide layout type to children
const QuickViewLayoutContext = createContext<QuickViewLayoutResolved>('sidesheet')

export function useQuickViewLayout(): QuickViewLayoutResolved {
  return useContext(QuickViewLayoutContext)
}

interface QuickViewProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode

  // Navigation
  onNavigateToCard?: (cardId: string) => void
  cardList?: Array<{ id: string; name: string }>
  currentCardId?: string

  // Layout preference (override auto-detection)
  preferredLayout?: QuickViewLayout

  // Loading state
  loading?: boolean

  // Error state
  error?: string | null

  // Hide the title in header (useful when content has its own title)
  showTitle?: boolean
}

/**
 * QuickView Component
 *
 * Responsive quickview that automatically adapts its presentation:
 * - Mobile (<768px): Bottom sheet that slides up
 * - Tablet (768-1023px): Centered modal overlay
 * - Desktop (≥1024px): Side sheet that slides in from right
 *
 * Content remains the same across all layouts, only the container changes.
 */
export default function QuickView({
  isOpen,
  onClose,
  title,
  children,
  onNavigateToCard,
  cardList,
  currentCardId,
  preferredLayout = 'auto',
  loading = false,
  error = null,
  showTitle = true
}: QuickViewProps) {
  const breakpoints = useBreakpoint()
  const [adjacentCards, setAdjacentCards] = useState<AdjacentCards>({
    prevCard: null,
    nextCard: null
  })

  // Determine layout based on screen size and preference
  const getLayout = (): 'bottomsheet' | 'modal' | 'sidesheet' => {
    if (preferredLayout !== 'auto') {
      return preferredLayout as 'bottomsheet' | 'modal' | 'sidesheet'
    }

    // Auto layout logic based on viewport:
    if (!breakpoints.md) {
      // Mobile: Bottom sheet
      return 'bottomsheet'
    } else if (!breakpoints.lg) {
      // Tablet: Center modal
      return 'modal'
    } else {
      // Desktop: Side sheet
      return 'sidesheet'
    }
  }

  const layout = getLayout()

  // Update adjacent cards when card list or current card changes
  const updateAdjacentCards = useCallback(() => {
    if (!currentCardId || !cardList) return
    const adjacent = calculateAdjacentCards(cardList, currentCardId)
    setAdjacentCards(adjacent)
  }, [cardList, currentCardId])

  useEffect(() => {
    updateAdjacentCards()
  }, [updateAdjacentCards])

  // Prevent background scrolling when quickview is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      return () => {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const handleNavigateToCard = useCallback((cardId: string) => {
    onNavigateToCard?.(cardId)
  }, [onNavigateToCard])

  // Keyboard navigation: Arrow keys for prev/next, Escape to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea/select
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (adjacentCards.prevCard) {
            e.preventDefault()
            handleNavigateToCard(adjacentCards.prevCard.id)
          }
          break
        case 'ArrowRight':
          if (adjacentCards.nextCard) {
            e.preventDefault()
            handleNavigateToCard(adjacentCards.nextCard.id)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, adjacentCards, onClose, handleNavigateToCard])

  if (!isOpen) return null

  // Render Loading State
  const renderLoading = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
    </div>
  )

  // Render Error State
  const renderError = () => (
    <div className="text-center py-12 px-4">
      <p className="text-red-600 text-sm">{error}</p>
    </div>
  )

  // Render Navigation Footer
  const renderNavigation = () => {
    if (!adjacentCards.prevCard && !adjacentCards.nextCard) return null

    return (
      <div className="flex-shrink-0 bg-white border-t border-grey-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => adjacentCards.prevCard && handleNavigateToCard(adjacentCards.prevCard.id)}
            disabled={!adjacentCards.prevCard}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              adjacentCards.prevCard
                ? 'text-orange-600 hover:bg-orange-50'
                : 'text-grey-300 cursor-not-allowed'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          <button
            onClick={() => adjacentCards.nextCard && handleNavigateToCard(adjacentCards.nextCard.id)}
            disabled={!adjacentCards.nextCard}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              adjacentCards.nextCard
                ? 'text-orange-600 hover:bg-orange-50'
                : 'text-grey-300 cursor-not-allowed'
            }`}
          >
            <span>Next</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // DESKTOP: Side Sheet Layout
  if (layout === 'sidesheet') {
    return (
      <QuickViewLayoutContext.Provider value="sidesheet">
        {/* Backdrop */}
        <div
          className="absolute top-0 left-0 bg-black/30 backdrop-blur-sm z-40"
          style={{
            height: `${document.documentElement.scrollHeight}px`,
            width: '100%',
          }}
          onClick={onClose}
        />

        {/* Side Sheet */}
        <div
          className="fixed top-0 right-0 h-screen w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out translate-x-0 flex flex-col"
          style={{ boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)' }}
        >
          {/* Header - Close button only, or with title */}
          <div className="flex-shrink-0 bg-white border-b border-grey-200 px-4 py-3 flex items-center justify-between">
            {showTitle && title ? (
              <h2 className="text-lg font-semibold text-grey-900 truncate">
                {title}
              </h2>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="text-grey-400 hover:text-grey-600 transition-colors p-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading && renderLoading()}
            {error && renderError()}
            {!loading && !error && children}
          </div>

          {/* Navigation Footer */}
          {renderNavigation()}
        </div>
      </QuickViewLayoutContext.Provider>
    )
  }

  // TABLET: Center Modal Layout
  if (layout === 'modal') {
    return (
      <QuickViewLayoutContext.Provider value="modal">
        {/* Backdrop */}
        <div
          className="absolute top-0 left-0 bg-black/50 backdrop-blur-sm z-40"
          style={{
            height: `${document.documentElement.scrollHeight}px`,
            width: '100%'
          }}
          onClick={onClose}
        />

        {/* Center Modal */}
        <div className={`fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-xl rounded-lg max-h-[90vh]
          bg-white shadow-2xl overflow-hidden flex flex-col
          transform transition-all duration-300 ease-out ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>

          {/* Header - Close button only, or with title */}
          <div className="flex-shrink-0 bg-white border-b border-grey-200 px-4 py-3 flex items-center justify-between">
            {showTitle && title ? (
              <h2 className="text-lg font-semibold text-grey-900 truncate">
                {title}
              </h2>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="text-grey-400 hover:text-grey-600 transition-colors p-1"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading && renderLoading()}
            {error && renderError()}
            {!loading && !error && children}
          </div>

          {/* Navigation Footer */}
          {renderNavigation()}
        </div>
      </QuickViewLayoutContext.Provider>
    )
  }

  // MOBILE: Bottom Sheet Layout
  return (
    <QuickViewLayoutContext.Provider value="bottomsheet">
      {/* Backdrop */}
      <div
        className="absolute top-0 left-0 bg-black/50 backdrop-blur-sm z-40"
        style={{
          height: `${document.documentElement.scrollHeight}px`,
          width: '100%'
        }}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className={`fixed z-50 bottom-0 left-0 right-0
        rounded-t-2xl max-h-[85vh]
        bg-white shadow-2xl overflow-hidden flex flex-col
        transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>

        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-8 h-1 bg-grey-300 rounded-full"></div>
        </div>

        {/* Header - Close button only, or with title */}
        <div className="flex-shrink-0 bg-white border-b border-grey-200 px-4 py-3 flex items-center justify-between">
          {showTitle && title ? (
            <h2 className="text-lg font-semibold text-grey-900 truncate">
              {title}
            </h2>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="text-grey-400 hover:text-grey-600 transition-colors p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading && renderLoading()}
          {error && renderError()}
          {!loading && !error && children}
        </div>

        {/* Navigation Footer */}
        {renderNavigation()}
      </div>
    </QuickViewLayoutContext.Provider>
  )
}
