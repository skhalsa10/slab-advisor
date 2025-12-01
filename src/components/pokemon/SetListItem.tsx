'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getLogoUrl } from '@/lib/pokemon-db'
import { usePreserveFilters } from '@/hooks/useURLFilters'
import type { PokemonSet } from '@/models/pokemon'

interface SetListItemProps {
  set: PokemonSet
  series?: {
    id: string
    name: string
  }
}

export default function SetListItem({ set, series }: SetListItemProps) {
  const hasLogo = set.logo || set.secondary_logo
  const { buildHref } = usePreserveFilters()

  return (
    <tr className="hover:bg-grey-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link href={buildHref(`/browse/pokemon/${set.id}`)} className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            {hasLogo ? (
              <Image
                src={getLogoUrl(set.logo, set.secondary_logo)}
                alt={set.name}
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-grey-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-grey-900">
              {set.name}
            </div>
            <div className="text-sm text-grey-500">
              {set.id}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-grey-900">{series?.name || 'Unknown'}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-grey-900">{set.card_count_total || 0}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-grey-900">
          {set.release_date ? new Date(set.release_date).toLocaleDateString() : 'Unknown'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Link
          href={buildHref(`/browse/pokemon/${set.id}`)}
          className="text-orange-600 hover:text-orange-900 transition-colors"
        >
          View details →
        </Link>
      </td>
    </tr>
  )
}