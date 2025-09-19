import { extractMarketPrices, getDisplayPrice } from '@/utils/priceUtils'
import type { Json } from '@/models/database'

interface PriceDisplayProps {
  priceData: Json | null | undefined
  showMarketLabel?: boolean
  className?: string
}

export default function PriceDisplay({
  priceData,
  showMarketLabel = true,
  className = ''
}: PriceDisplayProps) {
  // Extract and format price using utility functions
  const prices = extractMarketPrices(priceData)
  const displayPrice = getDisplayPrice(prices)

  return (
    <div className={className}>
      {showMarketLabel && (
        <p className="text-xs text-gray-500">Market price</p>
      )}
      <p className="text-base font-semibold text-gray-900">
        {displayPrice || 'Not available'}
      </p>
    </div>
  )
}