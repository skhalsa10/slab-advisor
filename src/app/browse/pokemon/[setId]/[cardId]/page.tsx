'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCard, getSetWithCards, getCardImageUrl } from '@/lib/pokemon-db'
import LoadingScreen from '@/components/ui/LoadingScreen'
import AppNavigation from '@/components/layout/AppNavigation'
import type { CardFull, SetWithCards } from '@/models/pokemon'

export default function CardDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const setId = params.setId as string
  const cardId = params.cardId as string
  
  const [card, setCard] = useState<CardFull | null>(null)
  const [set, setSet] = useState<SetWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [cardData, setData] = await Promise.all([
          getCard(cardId),
          getSetWithCards(setId)
        ])
        setCard(cardData)
        setSet(setData)
        setError(null)
      } catch (err) {
        setError('Failed to load card details')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [cardId, setId])

  // Find current card index for navigation
  const currentCardIndex = set?.cards.findIndex(c => c.id === cardId) ?? -1
  const previousCard = currentCardIndex > 0 ? set?.cards[currentCardIndex - 1] : null
  const nextCard = currentCardIndex < (set?.cards.length ?? 0) - 1 ? set?.cards[currentCardIndex + 1] : null

  if (loading) {
    return (
      <AppNavigation>
        <LoadingScreen fullScreen={false} />
      </AppNavigation>
    )
  }

  if (error || !card) {
    return (
      <AppNavigation>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-grey-900 mb-2">Error Loading Card</h3>
          <p className="text-sm text-grey-600 mb-4">{error || 'Card not found'}</p>
          <button
            onClick={() => router.push(`/browse/pokemon/${setId}`)}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Back to Set
          </button>
        </div>
      </AppNavigation>
    )
  }

  return (
    <AppNavigation>
      <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/explore" className="text-grey-600 hover:text-grey-900">
              Explore
            </Link>
            <span className="text-grey-400">/</span>
            <Link href="/browse/pokemon" className="text-grey-600 hover:text-grey-900">
              Pokemon
            </Link>
            <span className="text-grey-400">/</span>
            <Link href={`/browse/pokemon/${setId}`} className="text-grey-600 hover:text-grey-900">
              {set?.name || 'Set'}
            </Link>
            <span className="text-grey-400">/</span>
            <span className="text-grey-900 font-medium">{card.name}</span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
        <Link
          href={`/browse/pokemon/${setId}`}
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          ← Back to Set
        </Link>
        <div className="flex items-center space-x-4">
          {previousCard && (
            <Link
              href={`/browse/pokemon/${setId}/${previousCard.id}`}
              className="p-2 rounded-lg hover:bg-grey-100 transition-colors"
              title="Previous card"
            >
              <svg className="w-5 h-5 text-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          )}
          <span className="text-sm text-grey-600">
            Card {currentCardIndex + 1} of {set?.cards.length || 0}
          </span>
          {nextCard && (
            <Link
              href={`/browse/pokemon/${setId}/${nextCard.id}`}
              className="p-2 rounded-lg hover:bg-grey-100 transition-colors"
              title="Next card"
            >
              <svg className="w-5 h-5 text-grey-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
            </div>
          </div>

          {/* Card Details */}
          <div className="grid md:grid-cols-2 gap-8">
        {/* Card Image */}
        <div className="space-y-4">
          <div className="aspect-[2.5/3.5] relative rounded-lg overflow-hidden bg-grey-100">
            <Image
              src={getCardImageUrl(card.image, 'high', card.tcgplayer_image_url)}
              alt={card.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              onError={(e) => {
                e.currentTarget.src = '/card-placeholder.svg'
              }}
            />
          </div>
        </div>

        {/* Card Information */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-grey-900">{card.name}</h1>
            <p className="mt-2 text-lg text-grey-600">
              {card.category} • {set?.name}
            </p>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-sm text-grey-600">Card Number</p>
              <p className="text-lg font-semibold">#{card.local_id}</p>
            </div>
            {card.rarity && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-sm text-grey-600">Rarity</p>
                <p className="text-lg font-semibold">{card.rarity}</p>
              </div>
            )}
            {card.illustrator && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-sm text-grey-600">Illustrator</p>
                <p className="text-lg font-semibold">{card.illustrator}</p>
              </div>
            )}
          </div>

          {/* Additional Card Info */}
          <div className="space-y-4">
            {/* Category */}
            {card.category && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-sm text-grey-600">Category</p>
                <p className="font-semibold">{card.category}</p>
              </div>
            )}

            {/* Illustrator */}
            {card.illustrator && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-sm text-grey-600">Illustrator</p>
                <p className="font-semibold">{card.illustrator}</p>
              </div>
            )}

            {/* Variants */}
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-sm text-grey-600 mb-2">Available Variants</p>
              <div className="flex flex-wrap gap-2">
                {card.variant_normal && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Normal
                  </span>
                )}
                {card.variant_holo && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    Holo
                  </span>
                )}
                {card.variant_reverse && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Reverse
                  </span>
                )}
                {card.variant_first_edition && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    1st Edition
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </AppNavigation>
    )
}