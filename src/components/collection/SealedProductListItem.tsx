'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
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
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
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
  onViewProduct,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
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

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect()
    } else {
      onViewProduct()
    }
  }

  return (
    <tr
      className={`cursor-pointer transition-colors ${
        isSelected
          ? 'bg-orange-50 hover:bg-orange-100'
          : 'hover:bg-grey-50'
      }`}
      onClick={handleClick}
    >
      {/* Checkbox column — only in selection mode */}
      {isSelectionMode && (
        <td className="px-4 py-4 whitespace-nowrap w-12">
          <div
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-orange-500 border-2 border-orange-500'
                : 'border-2 border-grey-300 bg-white'
            }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
        </td>
      )}

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

      {/* Actions column — hidden in selection mode */}
      {!isSelectionMode && (
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
      )}
    </tr>
  )
}
