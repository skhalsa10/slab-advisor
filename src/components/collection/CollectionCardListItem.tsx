'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import type { CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { getCardDisplayName, getCardImageUrl } from '@/utils/collectionCardUtils'
import {
  formatVariant,
  formatCondition,
  formatQuantity,
  getListBadgeClasses
} from '@/utils/collectionMetadata'
import { getCollectionCardPrice, formatPrice, getCardTotalValue } from '@/utils/collectionPriceUtils'

interface CollectionCardListItemProps {
  card: CollectionCard
  onViewCard: () => void
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

/**
 * Collection Card List Item Component
 *
 * Displays a single collection card as a table row with collection-specific information:
 * - Card thumbnail and name
 * - Variant with color coding
 * - Condition with appropriate styling
 * - Quantity
 * - Date added to collection
 * - Action buttons
 * - Selection mode: checkbox column and orange highlight
 */
export default function CollectionCardListItem({
  card,
  onViewCard,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}: CollectionCardListItemProps) {

  const variant = formatVariant(card.variant, false, true, card.variant_pattern)
  const condition = formatCondition(card.condition, false, true)
  const quantity = formatQuantity(card.quantity)
  const badgeClasses = getListBadgeClasses()

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  const handleClick = () => {
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect()
    } else {
      onViewCard()
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

      {/* Card column */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <Image
              src={getCardImageUrl(card)}
              alt={getCardDisplayName(card)}
              className="h-12 w-12 rounded-md object-cover"
              width={48}
              height={48}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-grey-900">
              {getCardDisplayName(card)}
            </div>
            <div className="text-sm text-grey-500">
              Added {formatDate(card.created_at)}
            </div>
          </div>
        </div>
      </td>

      {/* Variant column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {variant ? (
          <span className={`${badgeClasses} ${variant.colorClass} ${variant.textColor}`}>
            {variant.text}
          </span>
        ) : (
          <span className="text-sm text-grey-500">-</span>
        )}
      </td>

      {/* Condition column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {condition ? (
          <span className={`${badgeClasses} ${condition.colorClass} ${condition.textColor}`}>
            {condition.text}
          </span>
        ) : (
          <span className="text-sm text-grey-500">-</span>
        )}
      </td>

      {/* Quantity column */}
      <td className="px-6 py-4 whitespace-nowrap text-center">
        {quantity.text === '1' ? (
          <span className="text-sm text-grey-500">1</span>
        ) : (
          <span className={`${badgeClasses} bg-blue-100 text-blue-800 font-semibold`}>
            {quantity.text}
          </span>
        )}
      </td>

      {/* Price column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className="text-sm font-semibold text-green-600">
          {formatPrice(getCollectionCardPrice(card as CollectionCardWithPokemon))}
        </span>
      </td>

      {/* Total column */}
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <span className="text-sm font-semibold text-green-600">
          {formatPrice(getCardTotalValue(card as CollectionCardWithPokemon))}
        </span>
      </td>

      {/* Added column */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
        {formatDate(card.created_at)}
      </td>

      {/* Actions column — hidden in selection mode */}
      {!isSelectionMode && (
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewCard()
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
