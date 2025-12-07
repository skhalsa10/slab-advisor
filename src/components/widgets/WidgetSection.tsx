import Link from 'next/link'

interface WidgetSectionProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
  children: React.ReactNode
}

/**
 * Reusable widget section wrapper with title and optional "View All" link
 *
 * Provides consistent styling for widget sections across the app:
 * - Section title on the left
 * - Optional "View All" link on the right
 * - Flexible content area for any children
 */
export default function WidgetSection({
  title,
  viewAllHref,
  viewAllLabel = 'View All',
  children
}: WidgetSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-grey-900">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 transition-colors"
          >
            {viewAllLabel}
            <svg
              className="w-4 h-4"
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
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}
