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
  const formatGrade = (grade: number | null): string => {
    if (grade === null) return 'Not graded'
    return `${grade}/10`
  }

  const formatConfidence = (confidence: number | null): string => {
    if (confidence === null) return 'N/A'
    return `${Math.round(confidence * 100)}%`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <div key={card.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative aspect-w-3 aspect-h-4 bg-grey-200">
            {card.front_image_url ? (
              <Image
                src={card.front_image_url}
                alt={card.card_title || 'Trading card'}
                className="w-full h-48 object-cover"
                width={300}
                height={192}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-48 flex items-center justify-center bg-grey-100">
                <svg className="h-12 w-12 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-grey-900 truncate">
                {card.card_title || 'Untitled Card'}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-mono ${
                card.estimated_grade 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-grey-100 text-grey-800'
              }`}>
                {formatGrade(card.estimated_grade)}
              </span>
            </div>
            
            <div className="text-xs text-grey-500 space-y-1">
              <div>Confidence: <span className="font-mono">{formatConfidence(card.confidence)}</span></div>
              <div>Analyzed: {formatDate(card.created_at)}</div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => onViewCard(card.id)}
                className="w-full text-center px-3 py-2 border border-orange-300 text-orange-700 text-sm font-medium rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}