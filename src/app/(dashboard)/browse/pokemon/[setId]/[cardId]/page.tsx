'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getCard, getSetWithCards, getCardImageUrl } from '@/lib/tcgdex'
import type { CardFull, SetWithCards } from '@/lib/tcgdex'

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
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-grey-200 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-[2.5/3.5] bg-grey-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-6 bg-grey-200 rounded w-2/3"></div>
              <div className="h-4 bg-grey-200 rounded w-1/2"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-grey-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !card) {
    return (
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
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
              src={getCardImageUrl(card.image, 'high')}
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
              <p className="text-lg font-semibold">#{card.localId}</p>
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

          {/* Pokemon Specific Info */}
          {card.category === 'Pokemon' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {card.hp && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-sm text-orange-600">HP</p>
                    <p className="text-2xl font-bold text-orange-700">{card.hp}</p>
                  </div>
                )}
                {card.types && card.types.length > 0 && (
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-sm text-orange-600">Type</p>
                    <p className="text-lg font-semibold text-orange-700">{card.types.join(', ')}</p>
                  </div>
                )}
              </div>

              {card.stage && (
                <div className="bg-grey-50 rounded-lg p-3">
                  <p className="text-sm text-grey-600">Stage</p>
                  <p className="font-semibold">{card.stage}</p>
                  {card.evolveFrom && (
                    <p className="text-sm text-grey-600 mt-1">Evolves from: {card.evolveFrom}</p>
                  )}
                </div>
              )}

              {card.abilities && card.abilities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-grey-900">Abilities</h3>
                  {card.abilities.map((ability, index) => (
                    <div key={index} className="bg-grey-50 rounded-lg p-3">
                      <p className="font-medium">{ability.type}: {ability.name}</p>
                      {ability.effect && (
                        <p className="text-sm text-grey-600 mt-1">{ability.effect}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {card.attacks && card.attacks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-grey-900">Attacks</h3>
                  {card.attacks.map((attack, index) => (
                    <div key={index} className="bg-grey-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{attack.name}</p>
                        {attack.damage && (
                          <p className="text-lg font-bold text-orange-600">{attack.damage}</p>
                        )}
                      </div>
                      {attack.cost && attack.cost.length > 0 && (
                        <p className="text-sm text-grey-600 mt-1">
                          Cost: {attack.cost.join(', ')}
                        </p>
                      )}
                      {attack.effect && (
                        <p className="text-sm text-grey-600 mt-1">{attack.effect}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(card.weaknesses || card.resistances || card.retreat) && (
                <div className="grid grid-cols-3 gap-3">
                  {card.weaknesses && card.weaknesses.length > 0 && (
                    <div className="bg-grey-50 rounded-lg p-3">
                      <p className="text-sm text-grey-600">Weakness</p>
                      {card.weaknesses.map((w, i) => (
                        <p key={i} className="font-medium">{w.type} {w.value}</p>
                      ))}
                    </div>
                  )}
                  {card.resistances && card.resistances.length > 0 && (
                    <div className="bg-grey-50 rounded-lg p-3">
                      <p className="text-sm text-grey-600">Resistance</p>
                      {card.resistances.map((r, i) => (
                        <p key={i} className="font-medium">{r.type} {r.value}</p>
                      ))}
                    </div>
                  )}
                  {card.retreat && (
                    <div className="bg-grey-50 rounded-lg p-3">
                      <p className="text-sm text-grey-600">Retreat Cost</p>
                      <p className="font-medium">{card.retreat}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Trainer Card Info */}
          {card.category === 'Trainer' && (
            <div className="space-y-4">
              {card.trainerType && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-sm text-orange-600">Trainer Type</p>
                  <p className="text-lg font-semibold text-orange-700">{card.trainerType}</p>
                </div>
              )}
              {card.effect && (
                <div className="bg-grey-50 rounded-lg p-4">
                  <h3 className="font-semibold text-grey-900 mb-2">Effect</h3>
                  <p className="text-sm whitespace-pre-wrap">{card.effect}</p>
                </div>
              )}
            </div>
          )}

          {/* Energy Card Info */}
          {card.category === 'Energy' && (
            <div className="space-y-4">
              {card.energyType && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <p className="text-sm text-orange-600">Energy Type</p>
                  <p className="text-lg font-semibold text-orange-700">{card.energyType}</p>
                </div>
              )}
              {card.effect && (
                <div className="bg-grey-50 rounded-lg p-4">
                  <h3 className="font-semibold text-grey-900 mb-2">Effect</h3>
                  <p className="text-sm whitespace-pre-wrap">{card.effect}</p>
                </div>
              )}
            </div>
          )}

          {/* Description (for Pokemon cards) */}
          {card.description && (
            <div className="bg-grey-50 rounded-lg p-4">
              <h3 className="font-semibold text-grey-900 mb-2">Pokédex Entry</h3>
              <p className="text-sm italic">{card.description}</p>
            </div>
          )}

          {/* Variants */}
          {card.variants && (
            <div className="bg-grey-50 rounded-lg p-4">
              <h3 className="font-semibold text-grey-900 mb-2">Available Variants</h3>
              <div className="flex flex-wrap gap-2">
                {card.variants.normal && (
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Normal</span>
                )}
                {card.variants.reverse && (
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Reverse Holo</span>
                )}
                {card.variants.holo && (
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Holo</span>
                )}
                {card.variants.firstEdition && (
                  <span className="px-3 py-1 bg-white rounded-full text-sm">1st Edition</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}