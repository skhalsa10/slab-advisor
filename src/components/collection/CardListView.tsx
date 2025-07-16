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

interface CardListViewProps {
  cards: Card[]
  onViewCard: (cardId: string) => void
}

export default function CardListView({ cards, onViewCard }: CardListViewProps) {
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

  const getGradeColor = (grade: number | null): string => {
    if (grade === null) return 'text-grey-600'
    if (grade >= 9) return 'text-green-700'
    if (grade >= 7) return 'text-yellow-700'
    if (grade >= 5) return 'text-orange-700'
    return 'text-red-700'
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden h-full">
      <div className="overflow-x-auto h-full overflow-y-auto">
        <table className="min-w-full divide-y divide-grey-200">
          <thead className="bg-grey-50 sticky top-0 z-5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Card
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Grade
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Confidence
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Analyzed
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-grey-200">
            {cards.map((card) => (
              <tr 
                key={card.id} 
                className="hover:bg-grey-50 cursor-pointer transition-colors"
                onClick={() => onViewCard(card.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {card.front_image_url ? (
                        <Image
                          src={card.front_image_url}
                          alt={card.card_title || 'Card'}
                          className="h-12 w-12 rounded-md object-cover"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-grey-100 flex items-center justify-center">
                          <svg className="h-6 w-6 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-grey-900">
                        {card.card_title || 'Untitled Card'}
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-mono ${getGradeColor(card.estimated_grade)}`}>
                    {formatConfidence(card.confidence)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-500">
                  {formatDate(card.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewCard(card.id)
                    }}
                    className="text-orange-600 hover:text-orange-900 transition-colors"
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile responsive version - stack cards on small screens */}
      <div className="block sm:hidden">
        <div className="space-y-3 p-4">
          {cards.map((card) => (
            <div 
              key={card.id} 
              className="bg-grey-50 rounded-lg p-4 cursor-pointer hover:bg-grey-100 transition-colors"
              onClick={() => onViewCard(card.id)}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {card.front_image_url ? (
                    <Image
                      src={card.front_image_url}
                      alt={card.card_title || 'Card'}
                      className="h-12 w-12 rounded-md object-cover"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-grey-200 flex items-center justify-center">
                      <svg className="h-6 w-6 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-grey-900 truncate">
                    {card.card_title || 'Untitled Card'}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono ${
                      card.estimated_grade 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-grey-100 text-grey-800'
                    }`}>
                      {formatGrade(card.estimated_grade)}
                    </span>
                    <span className="text-xs text-grey-500 font-mono">
                      {formatConfidence(card.confidence)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}