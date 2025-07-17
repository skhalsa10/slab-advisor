'use client'

import Image from 'next/image'

interface Card {
  id: string
  user_id: string
  front_image_url: string | null
  back_image_url: string | null
  card_title: string | null
  estimated_grade: number | null
  confidence: number | null
  created_at: string
  updated_at: string
}

interface CardGridViewProps {
  cards: Card[]
  onViewCard: (cardId: string) => void
}

export default function CardGridView({ cards, onViewCard }: CardGridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div 
          key={card.id} 
          className="cursor-pointer group"
          onClick={() => onViewCard(card.id)}
        >
          <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            {/* Card aspect ratio container - 2.5:3.5 ratio typical for trading cards */}
            <div className="relative" style={{ paddingBottom: '140%' }}>
              {card.front_image_url ? (
                <Image
                  src={card.front_image_url}
                  alt={card.card_title || 'Trading card'}
                  className="absolute inset-0 w-full h-full object-cover"
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
              ) : (
                <div className="absolute inset-0 bg-grey-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
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
                {card.card_title || 'Untitled Card'}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}