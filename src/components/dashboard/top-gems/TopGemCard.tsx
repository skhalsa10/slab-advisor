'use client'

/**
 * TopGemCard Component
 *
 * Displays a single high-value card with trophy-case styling.
 * Features gold/silver/bronze visual distinction based on rank.
 * Compact design for bento-box dashboard layout.
 */

import Image from 'next/image'
import Link from 'next/link'
import type { TopGem } from '@/types/top-gem'
import { getRankStyle } from './styles'

interface TopGemCardProps {
  gem: TopGem
  /** Set to true for the first card to prioritize image loading */
  priority?: boolean
}

/**
 * Format a number as compact currency
 */
function formatCurrency(value: number): string {
  // Use compact notation for values >= 1000
  if (value >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function TopGemCard({ gem, priority = false }: TopGemCardProps) {
  const style = getRankStyle(gem.rank)

  return (
    <Link
      href={`/collection/cards/${gem.collectionCardId}`}
      className={`
        group relative flex flex-col rounded-lg border overflow-hidden
        transition-all duration-200 hover:shadow-md hover:scale-[1.01]
        ${style.bgGradient} ${style.borderColor}
      `}
    >
      {/* Rank Badge - compact */}
      <div
        className={`
          absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded-full
          flex items-center justify-center
          text-xs font-bold shadow-sm
          ${style.rankBadgeBg} ${style.rankBadgeText}
        `}
      >
        {gem.rank}
      </div>

      {/* Card Image - compact padding */}
      <div className="relative aspect-[2.5/3.5] w-full p-2 pb-0">
        <div className="relative w-full h-full rounded overflow-hidden shadow-sm">
          <Image
            src={gem.imageUrl}
            alt={gem.cardName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 20vw, 150px"
            className="object-cover"
            priority={priority}
            onError={(e) => {
              e.currentTarget.src = '/card-placeholder.svg'
            }}
          />
        </div>
      </div>

      {/* Card Info - tight spacing */}
      <div className="flex flex-col p-2 pt-1.5">
        {/* Card Name */}
        <h3 className="font-medium text-grey-900 text-xs truncate" title={gem.cardName}>
          {gem.cardName}
        </h3>

        {/* Set + Number - hide on very small screens */}
        <p className="text-[10px] text-grey-500 truncate hidden sm:block">
          {gem.setName}
          {gem.cardNumber && ` #${gem.cardNumber}`}
        </p>

        {/* Value */}
        <p className="mt-0.5 text-sm font-bold text-grey-900">
          {formatCurrency(gem.currentValue)}
        </p>
      </div>
    </Link>
  )
}
