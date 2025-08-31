'use client'

import Image from 'next/image'
import type { CollectionCard } from '@/types/database'
import { getCardDisplayName, getCardImageUrl } from '@/utils/collectionCardUtils'

interface CollectionCardGridItemProps {
  card: CollectionCard
  onViewCard: () => void
  priority?: boolean
}

/**
 * Collection Card Grid Item Component
 * 
 * Displays a single collection card in grid format with collection-specific features:
 * - Grade badge overlay
 * - User uploaded image priority
 * - Card aspect ratio optimized for trading cards
 * - Hover effects and click interactions
 */
export default function CollectionCardGridItem({ 
  card, 
  onViewCard, 
  priority = false 
}: CollectionCardGridItemProps) {
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
        
        {/* Grade badge overlay on top-right corner */}
        {card.estimated_grade !== null && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold font-mono bg-green-600 text-white shadow-lg">
              {card.estimated_grade}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-2">
        <h3 className="text-xs font-medium text-grey-900 truncate">
          {getCardDisplayName(card)}
        </h3>
      </div>
    </div>
  )
}