'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getCard, getCardImageUrl } from '@/lib/pokemon-db'
import type { CardFull } from '@/models/pokemon'

interface CardDetailsModalProps {
  cardId: string
  setId: string
  isOpen: boolean
  onClose: () => void
}

export default function CardDetailsModal({ cardId, setId, isOpen, onClose }: CardDetailsModalProps) {
  const [card, setCard] = useState<CardFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !cardId) return

    async function fetchCard() {
      try {
        setLoading(true)
        const data = await getCard(cardId)
        setCard(data)
        setError(null)
      } catch (err) {
        setError('Failed to load card details')
        console.error('Error fetching card:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCard()
  }, [cardId, isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        fixed z-50 bg-white overflow-hidden
        md:right-0 md:top-0 md:h-full md:w-96 md:border-l md:border-grey-200 md:shadow-xl
        inset-0 md:inset-auto
      `}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-grey-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-grey-900">Card Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-grey-100 transition-colors"
          >
            <svg className="w-5 h-5 text-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-20">
          {loading ? (
            <div className="p-4 space-y-4">
              <div className="aspect-[2.5/3.5] bg-grey-200 rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-grey-200 rounded animate-pulse" />
                <div className="h-4 bg-grey-200 rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ) : error || !card ? (
            <div className="p-4 text-center">
              <p className="text-red-600">{error || 'Card not found'}</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Card Image */}
              <div className="aspect-[2.5/3.5] relative rounded-lg overflow-hidden bg-grey-100">
                <Image
                  src={getCardImageUrl(card.image, 'high')}
                  alt={card.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 384px"
                  priority
                  onError={(e) => {
                    e.currentTarget.src = '/card-placeholder.svg'
                  }}
                />
              </div>

              {/* Card Info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-bold text-grey-900">{card.name}</h3>
                  <p className="text-sm text-grey-600">
                    {card.category} • {card.set?.name}
                  </p>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-grey-50 rounded-lg p-2">
                    <p className="text-xs text-grey-600">Number</p>
                    <p className="font-medium">#{card.local_id}</p>
                  </div>
                  {card.rarity && (
                    <div className="bg-grey-50 rounded-lg p-2">
                      <p className="text-xs text-grey-600">Rarity</p>
                      <p className="font-medium">{card.rarity}</p>
                    </div>
                  )}
                </div>

                {/* Card Category */}
                {card.category && (
                  <div className="bg-grey-50 rounded-lg p-2">
                    <p className="text-xs text-grey-600">Category</p>
                    <p className="font-medium">{card.category}</p>
                  </div>
                )}

                {/* Illustrator */}
                {card.illustrator && (
                  <div className="bg-grey-50 rounded-lg p-2">
                    <p className="text-xs text-grey-600">Illustrator</p>
                    <p className="font-medium">{card.illustrator}</p>
                  </div>
                )}

                {/* Variants */}
                <div className="bg-grey-50 rounded-lg p-2">
                  <p className="text-xs text-grey-600 mb-1">Available Variants</p>
                  <div className="flex flex-wrap gap-1">
                    {card.variant_normal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Normal
                      </span>
                    )}
                    {card.variant_holo && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Holo
                      </span>
                    )}
                    {card.variant_reverse && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Reverse
                      </span>
                    )}
                    {card.variant_first_edition && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        1st Edition
                      </span>
                    )}
                  </div>
                </div>

                {/* View Full Details Link */}
                <Link
                  href={`/browse/pokemon/${setId}/${cardId}`}
                  className="block w-full text-center py-2 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  View Full Details
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}