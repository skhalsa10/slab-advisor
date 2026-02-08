import Link from 'next/link'
import Image from 'next/image'
import { getNewestSetsServer } from '@/lib/pokemon-db-server'
import { getLogoUrl } from '@/lib/pokemon-db'
import WidgetSection from './WidgetSection'
import HorizontalScroll from './HorizontalScroll'

interface NewestSetsWidgetProps {
  limit?: number
  viewAllHref?: string
}

/**
 * Self-contained widget showing the newest Pokemon sets
 *
 * This is a server component that fetches its own data.
 * Can be placed anywhere in the app without additional setup.
 *
 * Features:
 * - Horizontal scrolling carousel
 * - Set logo + name display
 * - Links to set detail pages
 * - Optional "View All" link
 */
export default async function NewestSetsWidget({ limit = 8, viewAllHref }: NewestSetsWidgetProps) {
  const sets = await getNewestSetsServer(limit)

  if (sets.length === 0) {
    return null
  }

  return (
    <WidgetSection title="Newest Sets" viewAllHref={viewAllHref}>
      <HorizontalScroll>
        {sets.map((set, index) => {
          const hasLogo = set.logo || set.secondary_logo

          return (
            <Link
              key={set.id}
              href={`/browse/pokemon/${set.id}`}
              className="flex-shrink-0 snap-start w-32 sm:w-36 group"
            >
              <div className="bg-white border border-grey-200 rounded-lg p-3 hover:border-orange-300 hover:shadow-md transition-all duration-200">
                {hasLogo ? (
                  <div className="h-16 sm:h-20 flex items-center justify-center mb-2">
                    <Image
                      src={getLogoUrl(set.logo, set.secondary_logo)}
                      alt={set.name}
                      width={120}
                      height={80}
                      className="object-contain w-auto h-full group-hover:scale-105 transition-transform duration-200"
                      style={{ width: 'auto', height: 'auto' }}
                      priority={index < 5}
                    />
                  </div>
                ) : (
                  <div className="h-16 sm:h-20 flex items-center justify-center mb-2 bg-grey-50 rounded">
                    <span className="text-grey-400 text-xs text-center px-2">
                      {set.name}
                    </span>
                  </div>
                )}
                <p className="text-xs font-medium text-grey-900 text-center truncate">
                  {set.name}
                </p>
              </div>
            </Link>
          )
        })}
      </HorizontalScroll>
    </WidgetSection>
  )
}
