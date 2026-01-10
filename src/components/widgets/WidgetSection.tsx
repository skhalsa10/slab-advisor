import Link from 'next/link'

interface WidgetSectionProps {
  title: string
  viewAllHref?: string
  viewAllLabel?: string
  /** Icon to display next to title */
  icon?: React.ReactNode
  /** Badge count to display in header (e.g., "15 Found") */
  badgeCount?: number
  /** Badge label suffix (default: "Found") */
  badgeLabel?: string
  /** If true, content bleeds to edges (for horizontal scroll). Default: false */
  noPadding?: boolean
  children: React.ReactNode
}

/**
 * Reusable widget section wrapper with bento box styling
 *
 * Provides consistent styling for widget sections across the app:
 * - White card container with rounded corners and subtle shadow
 * - Header with icon, title on the left
 * - Optional badge counter on the right
 * - Optional "View All" link
 * - Flexible content area for any children
 */
export default function WidgetSection({
  title,
  viewAllHref,
  viewAllLabel = 'View All',
  icon,
  badgeCount,
  badgeLabel = 'Found',
  noPadding = false,
  children,
}: WidgetSectionProps) {
  return (
    <section className="bg-white rounded-2xl border border-grey-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-grey-100">
        <div className="flex items-center gap-2">
          {icon && <span className="text-orange-500">{icon}</span>}
          <h2 className="text-base font-semibold text-grey-900">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {badgeCount !== undefined && (
            <span className="px-2.5 py-1 text-xs font-medium text-grey-600 bg-grey-100 rounded-full">
              {badgeCount} {badgeLabel}
            </span>
          )}
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
      </div>
      {/* Content */}
      <div className={noPadding ? 'px-4 py-3' : 'p-4'}>{children}</div>
    </section>
  )
}
