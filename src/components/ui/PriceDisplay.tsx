import { getSmartDisplayPrice } from '@/utils/priceUtils'
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
  // Use smart display logic to show "From $X.XX" for multiple variants
  const { price, hasMultipleVariants, variantCount } = getSmartDisplayPrice(priceData)

  return (
    <div className={className}>
      {showMarketLabel && (
        <p className="text-xs text-gray-500">Market price</p>
      )}
      <p className="text-base font-semibold text-gray-900">
        {price || 'Not available'}
      </p>
      {hasMultipleVariants && (
        <p className="text-xs text-gray-500 mt-0.5">
          {variantCount} variants
        </p>
      )}
    </div>
  )
}