'use client'

import Image from 'next/image'
import type { GradingOpportunity } from '@/types/grading-opportunity'
import { formatPrice } from '@/utils/collectionPriceUtils'

interface GradingOpportunityRowProps {
  opportunity: GradingOpportunity
  onClick: () => void
}

/**
 * Formats profit value with + or - prefix
 */
function formatProfit(profit: number | null): string {
  if (profit === null) return '\u2014' // em dash
  const absProfit = Math.abs(profit)
  const formatted = absProfit >= 1000
    ? `$${(absProfit / 1000).toFixed(1)}k`
    : `$${absProfit.toFixed(0)}`
  return profit >= 0 ? `+${formatted}` : `-${formatted}`
}

/**
 * Validates and returns a safe image URL
 */
function getSafeImageUrl(url: string | null | undefined): string {
  // Check for falsy or string representations of null/undefined
  if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
    return '/card-placeholder.svg'
  }

  const trimmedUrl = url.trim()

  // Must start with / (relative), http://, https://, or be a valid data URL
  if (
    trimmedUrl.startsWith('/') ||
    trimmedUrl.startsWith('http://') ||
    trimmedUrl.startsWith('https://') ||
    trimmedUrl.startsWith('data:image/')
  ) {
    return trimmedUrl
  }

  // Invalid URL format - use placeholder
  console.warn('Invalid image URL format:', trimmedUrl)
  return '/card-placeholder.svg'
}

/**
 * Single row in the grading opportunities widget (High Density Bento Style)
 *
 * Layout:
 * - Left: Card thumbnail (h-10 w-auto) + Title/Raw Price
 * - Right: PSA 10 profit (hero number) + Chevron
 */
export default function GradingOpportunityRow({
  opportunity,
  onClick,
}: GradingOpportunityRowProps) {
  const imageUrl = getSafeImageUrl(opportunity.imageUrl)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-4 border-b border-border last:border-b-0 hover:bg-accent/50 transition-all duration-200 cursor-pointer group text-left"
    >
      {/* Left Side: Thumbnail + Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <Image
            src={imageUrl}
            alt={opportunity.cardName}
            width={34}
            height={48}
            className="h-12 w-auto rounded-md shadow-sm object-cover"
            unoptimized={imageUrl.includes('ximilar.com')}
          />
        </div>

        {/* Card Info */}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm truncate">
            {opportunity.cardName}
          </p>
          <p className="text-xs text-muted-foreground">
            {opportunity.setName}
            {opportunity.cardNumber ? ` #${opportunity.cardNumber}` : ''} · Raw:{' '}
            {formatPrice(opportunity.currentMarketPrice)}
          </p>
        </div>
      </div>

      {/* Right Side: Hero Number + Chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* PSA 10 Profit (Hero Number) */}
        <span className="text-sm font-bold text-foreground">
          {formatProfit(opportunity.profitAtPsa10)}
        </span>

        {/* Chevron */}
        <svg
          className="w-4 h-4 text-muted-foreground group-hover:text-orange-500 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  )
}
