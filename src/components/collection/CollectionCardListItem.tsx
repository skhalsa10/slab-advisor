'use client'

import Image from 'next/image'
import type { CollectionCard } from '@/types/database'
import { getCardDisplayName, getCardImageUrl } from '@/utils/collectionCardUtils'

interface CollectionCardListItemProps {
  card: CollectionCard
  onViewCard: () => void
}

/**
 * Collection Card List Item Component
 * 
 * Displays a single collection card as a table row with collection-specific information:
 * - Card thumbnail and name
 * - Grade with color coding
 * - Date added to collection
 * - Action buttons
 */
export default function CollectionCardListItem({ 
  card, 
  onViewCard 
}: CollectionCardListItemProps) {
  
  const formatGrade = (grade: number | null): string => {
    if (grade === null) return 'Not graded'
    return `${grade}/10`
  }

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <tr 
      className="hover:bg-grey-50 cursor-pointer transition-colors"
      onClick={onViewCard}
    >
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
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${
          card.estimated_grade 
            ? 'bg-green-100 text-green-800' 
            : 'bg-grey-100 text-grey-800'
        }`}>
          {formatGrade(card.estimated_grade)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
        {formatDate(card.created_at)}
      </td>
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