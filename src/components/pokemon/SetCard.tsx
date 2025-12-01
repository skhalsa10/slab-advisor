'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getLogoUrl } from '@/lib/pokemon-db'
import { usePreserveFilters } from '@/hooks/useURLFilters'
import type { PokemonSet } from '@/models/pokemon'

interface SetCardProps {
  set: PokemonSet
  series?: {
    id: string
    name: string
  }
}

export default function SetCard({ set, series }: SetCardProps) {
  const hasLogo = set.logo || set.secondary_logo
  const { buildHref } = usePreserveFilters()

  return (
    <Link
      href={buildHref(`/browse/pokemon/${set.id}`)}
      className="group bg-white border border-grey-200 rounded-lg hover:border-orange-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        {hasLogo ? (
          <>
            <div className="h-20 sm:h-24 flex items-center justify-center mb-3">
              <Image
                src={getLogoUrl(set.logo, set.secondary_logo)}
                alt={set.name}
                width={150}
                height={100}
                className="object-contain w-auto h-full group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-grey-900 text-sm min-h-[2.5rem] flex items-center justify-center">
                {set.name}
              </h3>
              {series && (
                <p className="text-xs text-grey-600 font-medium mb-1">
                  {series.name}
                </p>
              )}
              <p className="text-xs text-grey-500">
                {set.card_count_total || 0} cards
                {set.release_date && (
                  <span> • {new Date(set.release_date).getFullYear()}</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="min-h-[8rem] sm:min-h-[9rem] py-4 flex flex-col items-center justify-center text-center">
            <h3 className="font-semibold text-grey-900 text-base sm:text-lg mb-2 px-2">
              {set.name}
            </h3>
            {series && (
              <p className="text-sm text-grey-600 font-medium mb-2">
                {series.name}
              </p>
            )}
            <p className="text-sm text-grey-500">
              {set.card_count_total || 0} cards
              {set.release_date && (
                <span> • {new Date(set.release_date).getFullYear()}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}