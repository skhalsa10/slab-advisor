interface HorizontalScrollProps {
  children: React.ReactNode
  className?: string
}

/**
 * Reusable horizontal scroll container with snap scrolling
 *
 * Features:
 * - Smooth horizontal scrolling with momentum
 * - Snap-to-item behavior for clean stops
 * - Custom scrollbar styling (thin, subtle)
 * - Padding at bottom for scrollbar space
 */
export default function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  return (
    <div
      className={`
        flex gap-4 overflow-x-auto pb-2
        snap-x snap-mandatory
        scrollbar-thin scrollbar-thumb-grey-300 scrollbar-track-transparent
        ${className}
      `}
    >
      {children}
    </div>
  )
}
