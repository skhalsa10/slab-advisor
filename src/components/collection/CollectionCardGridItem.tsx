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
  getBadgeBaseClasses 
} from '@/utils/collectionMetadata'
import { getCollectionPriceDisplay, shouldShowTotalPrice } from '@/utils/collectionPriceUtils'

interface CollectionCardGridItemProps {
  card: CollectionCard
  onViewCard: () => void
  priority?: boolean
}

/**
 * Collection Card Grid Item Component
 * 
 * Displays a single collection card in grid format with collection-specific features:
 * - Variant badge (top-left)
 * - Grade badge (top-right)
 * - Quantity badge (bottom-left)
 * - Condition badge (bottom-right)
 * - User uploaded image priority
 * - Card aspect ratio optimized for trading cards
 * - Hover effects and click interactions
 */
export default function CollectionCardGridItem({ 
  card, 
  onViewCard, 
  priority = false 
}: CollectionCardGridItemProps) {
  const variant = formatVariant(card.variant, true, false, card.variant_pattern)
  const condition = formatCondition(card.condition, true)
  const quantity = formatQuantity(card.quantity)
  const grade = formatGrade(card.estimated_grade, card.grading_data)
  const badgeClasses = getBadgeBaseClasses()

  return (
    <div 
      className="group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={onViewCard}
    >
      <div className="aspect-[2.5/3.5] relative">
        <Image
          src={getCardImageUrl(card)}
          alt={getCardDisplayName(card)}
          fill
          className="object-cover"
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        
        {/* Top-left: Variant badge */}
        {variant && (
          <div className="absolute top-2 left-2">
            <span className={`${badgeClasses} ${variant.colorClass} ${variant.textColor}`}>
              {variant.text}
            </span>
          </div>
        )}
        
        {/* Top-right: Grade badge */}
        {grade && (
          <div className="absolute top-2 right-2">
            <span className={`${badgeClasses} ${grade.colorClass} ${grade.textColor}`}>
              {grade.shortText}
            </span>
          </div>
        )}
        
        {/* Bottom-left: Quantity badge (only if > 1) */}
        {quantity.showBadge && (
          <div className="absolute bottom-2 left-2">
            <span className={`${badgeClasses} bg-blue-600/70 text-white`}>
              {quantity.displayText}
            </span>
          </div>
        )}
        
        {/* Bottom-right: Condition badge */}
        {condition && (
          <div className="absolute bottom-2 right-2">
            <span className={`${badgeClasses} ${condition.colorClass} ${condition.textColor}`}>
              {condition.text}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-2">
        <h3 className="text-xs font-medium text-grey-900 truncate">
          {getCardDisplayName(card)}
        </h3>
        <p className="text-xs font-semibold text-green-600 mt-1">
          {getCollectionPriceDisplay(card as CollectionCardWithPokemon, shouldShowTotalPrice(card))}
        </p>
      </div>
    </div>
  )
}