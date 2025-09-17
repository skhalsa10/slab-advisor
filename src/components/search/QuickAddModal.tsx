'use client'

import { useEffect } from 'react'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

/**
 * QuickAddModal Component
 * 
 * A dedicated modal component for the Quick Add feature with fixed dimensions
 * to prevent jarring resize/reposition issues. Always displays as a centered
 * modal regardless of viewport size.
 * 
 * Dimensions:
 * - Desktop: 600px width × 80vh height (max 700px)
 * - Mobile: 95vw width × 85vh height
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
          className={`
            bg-white rounded-lg shadow-2xl pointer-events-auto
            flex flex-col
            transform transition-all duration-300 ease-out
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            
            /* Mobile dimensions */
            w-[95vw] h-[85vh] min-h-[60vh] max-h-[85vh]
            
            /* Desktop dimensions (sm and up) */
            sm:w-full sm:max-w-[600px] 
            sm:h-[80vh] sm:max-h-[700px] sm:min-h-[500px]
          `}
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 bg-white border-b border-grey-200 px-4 py-3 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-grey-900 truncate">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-grey-400 hover:text-grey-600 transition-colors p-1 rounded-md hover:bg-grey-100"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </>
  )
}