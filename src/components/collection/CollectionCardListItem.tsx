'use client'

import Image from 'next/image'
import type { CollectionCard } from '@/types/database'
import { type CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { getCardDisplayName, getCardImageUrl } from '@/utils/collectionCardUtils'
import { 
  formatVariant, 
  formatCondition, 
  formatQuantity, 
  formatGrade, 
  getListBadgeClasses 
} from '@/utils/collectionMetadata'
import { getCollectionCardPrice, formatPrice, getCardTotalValue } from '@/utils/collectionPriceUtils'

interface CollectionCardListItemProps {
  card: CollectionCard
  onViewCard: () => void
}

/**
 * Collection Card List Item Component
 * 
 * Displays a single collection card as a table row with collection-specific information:
 * - Card thumbnail and name
 * - Variant with color coding
 * - Condition with appropriate styling
 * - Quantity
 * - Grade with color coding
 * - Date added to collection
 * - Action buttons
 */
export default function CollectionCardListItem({ 
  card, 
  onViewCard 
}: CollectionCardListItemProps) {
  
  const variant = formatVariant(card.variant, false, true)
  const condition = formatCondition(card.condition, false, true)
  const quantity = formatQuantity(card.quantity)
  const grade = formatGrade(card.estimated_grade, card.grading_data)
  const badgeClasses = getListBadgeClasses()

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <tr 
      className="hover:bg-grey-50 cursor-pointer transition-colors"
      onClick={onViewCard}
    >
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

      {/* Grade column */}
      <td className="px-6 py-4 whitespace-nowrap">
        {grade ? (
          <span className={`${badgeClasses} ${grade.isProfessional ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-green-100 border-green-300 text-green-800'} font-mono`}>
            {grade.text}
          </span>
        ) : (
          <span className="text-sm text-grey-500">Not graded</span>
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

      {/* Actions column */}
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
    </tr>
  )
}