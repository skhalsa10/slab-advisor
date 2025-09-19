import Image from 'next/image'
import { getCardImageUrl } from '@/lib/pokemon-db'
import PriceDisplay from '@/components/ui/PriceDisplay'
import type { Json } from '@/models/database'

interface CardListItemProps {
  card: {
    id: string
    name: string
    image?: string | null
    tcgplayer_image_url?: string | null
    local_id?: string | number | null
    rarity?: string | null
    price_data?: Json | null // JSONB price data from database
  }
  setId: string
  onClick: (e: React.MouseEvent, cardId: string) => void
}

export default function CardListItem({ card, setId, onClick }: CardListItemProps) {
  const imageUrl = getCardImageUrl(card.image, 'low', card.tcgplayer_image_url || undefined)
  
  
  return (
    <tr className="hover:bg-grey-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={(e) => onClick(e, card.id)}
          className="flex items-center text-left hover:text-orange-600 transition-colors"
        >
          <div className="flex-shrink-0 h-12 w-9">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={card.name}
                width={36}
                height={48}
                className="h-12 w-9 object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="h-12 w-9 rounded bg-grey-100 flex items-center justify-center">
                <svg className="h-6 w-5 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-grey-900">
              {card.name}
            </div>
            <div className="text-xs text-grey-500">
              {card.id}
            </div>
          </div>
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-grey-900">
          {card.local_id ? `#${card.local_id}` : '-'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-grey-900">
          {card.rarity || 'Unknown'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <PriceDisplay
          priceData={card.price_data}
          showMarketLabel={false}
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <a
          href={`/browse/pokemon/${setId}/${card.id}`}
          className="text-orange-600 hover:text-orange-900 transition-colors"
        >
          View details →
        </a>
      </td>
    </tr>
  )
}