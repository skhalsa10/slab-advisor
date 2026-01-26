'use client'

import Image from 'next/image'
import {
  type CollectionProductWithPriceChanges,
  getProductDisplayName,
  getProductSetName,
  getProductImageUrl,
  getProductMarketPrice,
  getProductTotalValue,
  formatProductCondition,
  getConditionBadgeColor,
  getMarketTrend7d,
  formatMarketTrend,
  getGainLossDollars,
  getGainLossPercent,
  formatGainLoss,
  getGainLossColor
} from '@/utils/collectionProductUtils'
import { getListBadgeClasses } from '@/utils/collectionMetadata'

interface SealedProductListItemProps {
  product: CollectionProductWithPriceChanges
  onViewProduct: () => void
}

/**
 * Sealed Product List Item Component
 *
 * Displays a single sealed product as a table row with financial metrics:
 * - Product thumbnail, name, and set
 * - Condition badge
 * - Quantity
 * - Cost basis (purchase price)
 * - Current market price
 * - 7-day market trend
 * - Total value
 * - Gain/Loss (ROI)
 * - Action buttons
 */
export default function SealedProductListItem({
  product,
  onViewProduct
}: SealedProductListItemProps) {
  const quantity = product.quantity || 1
  const marketPrice = getProductMarketPrice(product)
  const totalValue = getProductTotalValue(product)
  const purchasePrice = product.purchase_price
  const badgeClasses = getListBadgeClasses()

  // Calculate financial metrics
  const trend = getMarketTrend7d(marketPrice, product.price_7d_ago ?? null)
  const gainLossDollars = getGainLossDollars(product)
  const gainLossPercent = getGainLossPercent(product)
  const hasCostBasis = purchasePrice !== null

  const formatCurrency = (value: number | null): string => {
    if (value === null) return '-'
    return `$${value.toFixed(2)}`
  }

  return (
    <tr
      className="hover:bg-grey-50 cursor-pointer transition-colors"
      onClick={onViewProduct}
    >
      {/* Product column - Thumbnail + Name + Set */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <Image
              src={getProductImageUrl(product)}
              alt={getProductDisplayName(product)}
              className="h-12 w-12 rounded-md object-contain"
              width={48}
              height={48}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-grey-900">
              {getProductDisplayName(product)}
            </div>
            <div className="text-sm text-grey-500">
              {getProductSetName(product)}
            </div>
          </div>
        </div>
      </td>

      {/* Condition column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`${badgeClasses} ${getConditionBadgeColor(product.condition)}`}
        >
          {formatProductCondition(product.condition)}
        </span>
      </td>

      {/* Quantity column */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        {quantity === 1 ? (
          <span className="text-sm text-grey-500">1</span>
        ) : (
          <span
            className={`${badgeClasses} bg-gray-900 text-white font-semibold`}
          >
            x{quantity}
          </span>
        )}
      </td>

      {/* Cost Basis column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {hasCostBasis ? (
          <span className="text-sm text-grey-700">
            {formatCurrency(purchasePrice)}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewProduct()
            }}
            className="px-2 py-0.5 bg-grey-100 text-grey-600 text-xs rounded-full hover:bg-grey-200 transition-colors"
          >
            Add Cost
          </button>
        )}
      </td>

      {/* Market Price column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className="text-sm text-grey-700">
          {formatCurrency(marketPrice)}
        </span>
      </td>

      {/* Market Trend column - Hidden on mobile */}
      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right">
        <span className={`text-sm ${getGainLossColor(trend)}`}>
          {formatMarketTrend(trend)}
        </span>
      </td>

      {/* Total Value column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className="text-sm font-semibold text-green-600">
          {formatCurrency(totalValue)}
        </span>
      </td>

      {/* Gain/Loss column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {hasCostBasis ? (
          <span className={`text-sm font-medium ${getGainLossColor(gainLossDollars)}`}>
            {formatGainLoss(gainLossDollars, gainLossPercent)}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewProduct()
            }}
            className="px-2 py-0.5 bg-grey-100 text-grey-600 text-xs rounded-full hover:bg-grey-200 transition-colors"
          >
            Add Cost
          </button>
        )}
      </td>

      {/* Actions column */}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewProduct()
          }}
          className="text-orange-600 hover:text-orange-900 transition-colors"
        >
          View details
        </button>
      </td>
    </tr>
  )
}
