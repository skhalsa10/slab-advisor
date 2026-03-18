'use client'

import { useEffect } from 'react'
import { useBreakpoint } from '@/hooks/useIsDesktop'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * QuickAddModal Component
 *
 * A responsive modal component for the Quick Add feature:
 * - Mobile (<768px): Bottom sheet that slides up from bottom
 * - Tablet/Desktop (>=768px): Centered modal
 *
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback when modal should close
 * @param title - Modal header title
 * @param children - Modal content
 */
export default function QuickAddModal({
  isOpen,
  onClose,
  title,
  children
}: QuickAddModalProps) {
  const breakpoints = useBreakpoint()
  const isMobile = !breakpoints.md // < 768px

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position and prevent scrolling
      const scrollY = window.scrollY
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'

      return () => {
        // Restore scroll position and scrolling ability
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Shared close button
  const CloseButton = () => (
    <button
      onClick={onClose}
      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-secondary"
      aria-label="Close modal"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )

  // MOBILE: Bottom Sheet Layout
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
          aria-label="Close modal"
        />

        {/* Bottom Sheet */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          className={`
            fixed z-50 bottom-0 left-0 right-0
            bg-card rounded-t-2xl shadow-2xl
            flex flex-col
            h-[85vh]
            transform transition-transform duration-300 ease-out
            ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          `}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground rounded-full" />
          </div>

          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border">
            <h2 id="quick-add-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <CloseButton />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain transition-all duration-200 ease-out">
            {children}
          </div>

          {/* Safe area padding for devices with home indicator */}
          <div className="flex-shrink-0 h-safe-area-inset-bottom pb-4" />
        </div>
      </>
    )
  }

  // TABLET/DESKTOP: Centered Modal Layout
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          className={`
            bg-card rounded-lg shadow-2xl pointer-events-auto
            flex flex-col
            transform transition-all duration-300 ease-out
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}

            /* Tablet/Desktop dimensions - fixed height to prevent layout shift */
            w-full max-w-[600px]
            h-[70vh] max-h-[600px]
          `}
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 id="quick-add-title" className="text-lg font-semibold text-foreground truncate">
                {title}
              </h2>
              <CloseButton />
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain transition-all duration-200 ease-out">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}
