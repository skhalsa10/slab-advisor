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
 * Single row in the grading opportunities widget
 *
 * Layout:
 * - Left: Small card thumbnail (h-12 w-9, rounded-md)
 * - Middle: Card name (truncated) + "Raw: $XXX"
 * - Right: "PSA 10: +$XXX" (green) + "PSA 9: +$XXX" (gray)
 */
export default function GradingOpportunityRow({
  opportunity,
  onClick,
}: GradingOpportunityRowProps) {
  const imageUrl = getSafeImageUrl(opportunity.imageUrl)

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-grey-50 transition-colors text-left"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0">
        <Image
          src={imageUrl}
          alt={opportunity.cardName}
          width={36}
          height={48}
          className="rounded-md object-cover"
          unoptimized={imageUrl.includes('ximilar.com')}
        />
      </div>

      {/* Middle: Card info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-grey-900 text-sm truncate">
          {opportunity.cardName}
        </p>
        <p className="text-xs text-grey-500">
          Raw: {formatPrice(opportunity.currentMarketPrice)}
        </p>
      </div>

      {/* Right: Profit info */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-bold text-green-600">
          PSA 10: {formatProfit(opportunity.profitAtPsa10)}
        </p>
        {opportunity.profitAtPsa9 !== null && (
          <p className="text-xs font-medium text-grey-400">
            PSA 9: {formatProfit(opportunity.profitAtPsa9)}
          </p>
        )}
      </div>
    </button>
  )
}
