'use client'

import { useRef, useState, useEffect } from 'react'

interface HorizontalScrollProps {
  children: React.ReactNode
  className?: string
}

/**
 * Reusable horizontal scroll container with navigation
 *
 * Features:
 * - Smooth horizontal scrolling with momentum
 * - Snap-to-item behavior for clean stops
 * - Arrow buttons on desktop (appear on hover)
 * - Gradient fade on right edge to indicate more content
 * - Smart visibility: arrows/gradient hide at scroll boundaries
 */
export default function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Update scroll state based on scroll position
  const updateScrollState = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    updateScrollState()
    window.addEventListener('resize', updateScrollState)
    return () => window.removeEventListener('resize', updateScrollState)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative group">
      {/* Left Arrow - desktop only, appears on hover when can scroll left */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                     hidden md:group-hover:flex
                     w-10 h-10 items-center justify-center
                     bg-white/90 rounded-full shadow-lg border border-grey-200
                     hover:bg-white transition-colors"
          aria-label="Scroll left"
        >
          <svg
            className="w-5 h-5 text-grey-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`
          flex gap-4 overflow-x-auto pb-2
          snap-x snap-mandatory
          scrollbar-thin scrollbar-thumb-grey-300 scrollbar-track-transparent
          ${className}
        `}
      >
        {children}
      </div>

      {/* Right Arrow - desktop only, appears on hover when can scroll right */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                     hidden md:group-hover:flex
                     w-10 h-10 items-center justify-center
                     bg-white/90 rounded-full shadow-lg border border-grey-200
                     hover:bg-white transition-colors"
          aria-label="Scroll right"
        >
          <svg
            className="w-5 h-5 text-grey-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Right gradient fade - indicates more content exists */}
      {canScrollRight && (
        <div
          className="absolute right-0 top-0 bottom-2 w-12
                     bg-gradient-to-l from-white to-transparent
                     pointer-events-none"
        />
      )}
    </div>
  )
}
