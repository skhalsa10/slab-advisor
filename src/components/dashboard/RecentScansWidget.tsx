import Image from 'next/image'
import { getRecentScans, type RecentScan } from '@/lib/recent-scans-server'

interface RecentScansWidgetProps {
  limit?: number
}

/**
 * Formats a timestamp to a relative time string (e.g., "2h ago", "3d ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) {
    return `${diffDays}d ago`
  } else if (diffHours > 0) {
    return `${diffHours}h ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ago`
  } else {
    return 'Just now'
  }
}

/**
 * Returns the badge text and color based on the grade
 */
function getGradeBadge(grade: number | null): {
  text: string
  colorClass: string
} | null {
  if (grade === null) return null

  const roundedGrade = Math.round(grade * 10) / 10

  if (roundedGrade >= 10) {
    return { text: 'GEM MINT 10', colorClass: 'text-green-600' }
  } else if (roundedGrade >= 9) {
    return { text: `MINT ${roundedGrade}`, colorClass: 'text-grey-600' }
  } else if (roundedGrade >= 8) {
    return { text: `NM-MT ${roundedGrade}`, colorClass: 'text-grey-500' }
  } else if (roundedGrade >= 7) {
    return { text: `NM ${roundedGrade}`, colorClass: 'text-grey-500' }
  } else {
    return { text: `${roundedGrade}`, colorClass: 'text-grey-400' }
  }
}

/**
 * Mini-Slab card component for the carousel
 */
function MiniSlabCard({ scan }: { scan: RecentScan }) {
  const badge = getGradeBadge(scan.gradeFinal)

  return (
    <div className="flex-shrink-0 snap-start w-36 sm:w-40">
      {/* Card Image with Badge */}
      <div className="relative aspect-[3/4] mb-2">
        <Image
          src={scan.imageUrl}
          alt={scan.cardName}
          fill
          className="rounded-xl object-cover border border-grey-200 shadow-sm"
          sizes="(max-width: 640px) 144px, 160px"
        />
        {/* Grade Badge - positioned at bottom center */}
        {badge && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
            <div
              className={`backdrop-blur-md bg-white/90 shadow-sm border border-grey-200 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${badge.colorClass}`}
            >
              {badge.text}
            </div>
          </div>
        )}
      </div>
      {/* Footer: Card Name + Timestamp */}
      <div className="px-1">
        <p className="text-sm font-medium text-grey-900 truncate">
          {scan.cardName}
        </p>
        <p className="text-xs text-grey-400">{formatRelativeTime(scan.createdAt)}</p>
      </div>
    </div>
  )
}

/**
 * Server component that displays a horizontal carousel of recent AI grading scans
 *
 * Features:
 * - Horizontal scrolling carousel with hidden scrollbar
 * - Mini-slab card design with grade badges
 * - Relative timestamps (e.g., "2h ago")
 * - Returns null if user has no scans (widget not rendered)
 */
export default async function RecentScansWidget({
  limit = 10,
}: RecentScansWidgetProps) {
  const { scans } = await getRecentScans(limit)

  // Don't render if no scans
  if (scans.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-2xl border border-grey-100 shadow-sm p-6">
      <h2 className="font-bold text-grey-900 mb-4">Recent Scans</h2>

      {/* Horizontal Scroll Carousel */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
        {scans.map((scan) => (
          <MiniSlabCard key={scan.id} scan={scan} />
        ))}
      </div>
    </section>
  )
}
