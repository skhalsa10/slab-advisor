'use client'

import { useEffect, useState, useCallback } from 'react'
import { useBreakpoint } from '@/hooks/useIsDesktop'

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  anchorRect?: DOMRect | null // For popover positioning on desktop
  title?: string
}

type LayoutMode = 'popover' | 'modal' | 'bottomsheet'

interface PopoverPosition {
  top: number
  left: number
  placement: 'below' | 'above'
}

/**
 * QuickAddModal Component
 *
 * Responsive modal that adapts its presentation:
 * - Mobile (<768px): Bottom sheet that slides up
 * - Tablet (768-1023px): Centered modal overlay
 * - Desktop (≥1024px): Smart popover anchored to trigger element
 */
export default function QuickAddModal({
  isOpen,
  onClose,
  children,
  anchorRect,
  title = 'Quick Add'
}: QuickAddModalProps) {
  const breakpoints = useBreakpoint()
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null)
  const [useFallbackModal, setUseFallbackModal] = useState(false)

  // Determine layout based on screen size
  const getLayout = useCallback((): LayoutMode => {
    if (!breakpoints.md) {
      return 'bottomsheet' // Mobile
    } else if (!breakpoints.lg) {
      return 'modal' // Tablet
    } else {
      return 'popover' // Desktop
    }
  }, [breakpoints.md, breakpoints.lg])

  const layout = getLayout()

  // Calculate popover position with smart edge detection
  const calculatePopoverPosition = useCallback(() => {
    if (!anchorRect || layout !== 'popover') {
      setPopoverPosition(null)
      setUseFallbackModal(false)
      return
    }

    const popoverWidth = 320
    const popoverHeight = 380 // Approximate height
    const padding = 12
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Try positioning below the anchor first
    let top = anchorRect.bottom + padding
    let left = anchorRect.right - popoverWidth
    let placement: 'below' | 'above' = 'below'

    // Check if popover would overflow right edge
    if (left < padding) {
      left = padding
    }
    if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding
    }

    // Check if popover would overflow bottom edge
    if (top + popoverHeight > viewportHeight - padding) {
      // Try positioning above
      const topAbove = anchorRect.top - popoverHeight - padding
      if (topAbove >= padding) {
        top = topAbove
        placement = 'above'
      } else {
        // Not enough space above or below - fall back to centered modal
        setUseFallbackModal(true)
        setPopoverPosition(null)
        return
      }
    }

    setUseFallbackModal(false)
    setPopoverPosition({ top, left, placement })
  }, [anchorRect, layout])

  // Recalculate position when anchor changes or on window resize
  useEffect(() => {
    if (isOpen && layout === 'popover') {
      calculatePopoverPosition()

      const handleResize = () => calculatePopoverPosition()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, layout, calculatePopoverPosition])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent background scrolling when modal is open
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

  if (!isOpen) return null

  // Shared close button
  const CloseButton = () => (
    <button
      onClick={onClose}
      className="text-grey-400 hover:text-grey-600 transition-colors p-1"
      aria-label="Close"
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )

  // DESKTOP: Popover Layout (or fallback to modal if no space)
  if (layout === 'popover' && !useFallbackModal && popoverPosition) {
    return (
      <>
        {/* Backdrop - lighter for popover */}
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />

        {/* Popover */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          className="fixed z-50 w-80 bg-white rounded-lg shadow-2xl border border-grey-200 overflow-hidden"
          style={{
            top: popoverPosition.top,
            left: popoverPosition.left,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-grey-200 bg-grey-50">
            <h2 id="quick-add-title" className="text-sm font-semibold text-grey-900">
              {title}
            </h2>
            <CloseButton />
          </div>

          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </>
    )
  }

  // TABLET or Desktop Fallback: Center Modal Layout
  if (layout === 'modal' || (layout === 'popover' && useFallbackModal)) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />

        {/* Center Modal */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-add-title"
          className={`
            fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-full max-w-sm mx-4
            bg-white rounded-lg shadow-2xl overflow-hidden
            transform transition-all duration-200 ease-out
            ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-grey-200 bg-grey-50">
            <h2 id="quick-add-title" className="text-sm font-semibold text-grey-900">
              {title}
            </h2>
            <CloseButton />
          </div>

          {/* Content */}
          <div className="p-4">
            {children}
          </div>
        </div>
      </>
    )
  }

  // MOBILE: Bottom Sheet Layout
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className={`
          fixed z-50 bottom-0 left-0 right-0
          bg-white rounded-t-2xl shadow-2xl overflow-hidden
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-grey-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-grey-200">
          <h2 id="quick-add-title" className="text-base font-semibold text-grey-900">
            {title}
          </h2>
          <CloseButton />
        </div>

        {/* Content */}
        <div className="p-4 pb-8">
          {children}
        </div>
      </div>
    </>
  )
}
