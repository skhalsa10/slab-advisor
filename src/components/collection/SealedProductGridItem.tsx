'use client'

import Image from 'next/image'
import {
  type CollectionProductWithPriceChanges,
  getProductDisplayName,
  getProductImageUrl,
  getProductTotalValue,
  getProductMarketPrice,
  formatProductCondition,
  getConditionBadgeColor,
  getMarketTrend7d,
  formatMarketTrend,
  getGainLossColor
} from '@/utils/collectionProductUtils'
import { getBadgeBaseClasses } from '@/utils/collectionMetadata'

interface SealedProductGridItemProps {
  product: CollectionProductWithPriceChanges
  onViewProduct: () => void
  priority?: boolean
}

/**
 * Sealed Product Grid Item Component
 *
 * Displays a single sealed product in grid format with collection-specific features:
 * - Quantity badge (top-left) when qty > 1
 * - Condition badge (bottom-right)
 * - Product image and name
 * - Total value display
 * - Hover effects and click interactions
 */
export default function SealedProductGridItem({
  product,
  onViewProduct,
  priority = false
}: SealedProductGridItemProps) {
  const quantity = product.quantity || 1
  const totalValue = getProductTotalValue(product)
  const marketPrice = getProductMarketPrice(product)
  const badgeClasses = getBadgeBaseClasses()

  // Only show condition badge for non-sealed (since we're in the Sealed tab, "sealed" is redundant)
  const showConditionBadge =
    product.condition && product.condition !== 'sealed'

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={onViewProduct}
    >
      <div className="aspect-[2.5/3.5] relative bg-grey-100">
        <Image
          src={getProductImageUrl(product)}
          alt={getProductDisplayName(product)}
          fill
          className="object-contain p-2"
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />

        {/* Top-left: Quantity badge (only if > 1) */}
        {quantity > 1 && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-900 text-white shadow-sm">
              x{quantity}
            </span>
          </div>
        )}

        {/* Bottom-right: Condition badge (only show non-sealed conditions) */}
        {showConditionBadge && (
          <div className="absolute bottom-2 right-2">
            <span
              className={`${badgeClasses} ${getConditionBadgeColor(product.condition!)}`}
            >
              {formatProductCondition(product.condition!)}
            </span>
          </div>
        )}
      </div>

      <div className="p-2">
        <h3 className="text-xs font-medium text-grey-900 truncate">
          {getProductDisplayName(product)}
        </h3>
        <p className="text-xs font-semibold text-green-600 mt-1">
          {totalValue !== null ? `$${totalValue.toFixed(2)}` : 'Price unavailable'}
        </p>
        {/* Unit price shown when quantity > 1 */}
        {quantity > 1 && marketPrice !== null && (
          <p className="text-xs text-gray-500">
            (${marketPrice.toFixed(2)} / ea)
          </p>
        )}
        {/* 7-day market trend */}
        {(() => {
          const trend = getMarketTrend7d(marketPrice, product.price_7d_ago ?? null)
          if (trend === null) return null
          return (
            <p className={`text-xs ${getGainLossColor(trend)}`}>
              {formatMarketTrend(trend)}
            </p>
          )
        })()}
      </div>
    </div>
  )
}
