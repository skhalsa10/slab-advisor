'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getCard, getCardImageUrl, getAdjacentCards } from '@/lib/pokemon-db'
import type { CardFull } from '@/models/pokemon'

interface CardDetailsModalProps {
  cardId: string
  setId?: string  // Optional for future card types
  cardType?: 'pokemon' | 'onepiece' | 'sports' | 'other'  // Extensible for future
  isOpen: boolean
  onClose: () => void
}

export default function CardDetailsModal({
  cardId,
  setId,
  cardType = 'pokemon',  // Default to pokemon for now
  isOpen,
  onClose
}: CardDetailsModalProps) {
  const [cardData, setCardData] = useState<CardFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjacentCards, setAdjacentCards] = useState<{
    prevCard: { id: string; name: string } | null
    nextCard: { id: string; name: string } | null
  }>({ prevCard: null, nextCard: null})

  const loadCardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Future: Add switch statement for different card types
      if (cardType === 'pokemon') {
        const [card, adjacent] = await Promise.all([
          getCard(cardId),
          setId ? getAdjacentCards(cardId, setId) : Promise.resolve({ previous: null, next: null })
        ])
        
        setCardData(card)
        setAdjacentCards({
          prevCard: adjacent.previous ? { id: adjacent.previous.id, name: adjacent.previous.name } : null,
          nextCard: adjacent.next ? { id: adjacent.next.id, name: adjacent.next.name } : null
        })
      }
      // Future: Add other card type handlers here
      
    } catch (err) {
      setError('Failed to load card details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cardId, cardType, setId])

  useEffect(() => {
    if (isOpen && cardId) {
      loadCardData()
    }
  }, [cardId, isOpen, loadCardData])

  const getCardName = () => {
    if (!cardData) return 'Loading...'
    
    // Handle different card types
    switch (cardType) {
      case 'pokemon':
        return cardData.name
      // Future: Add other card types
      default:
        return 'Card Details'
    }
  }

  const getCardImage = () => {
    if (!cardData) return null
    
    switch (cardType) {
      case 'pokemon':
        return getCardImageUrl(cardData.image, 'high')
      // Future: Add other card types
      default:
        return null  // For now, only handle Pokemon cards
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-grey-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-grey-900">
            {getCardName()}
          </h2>
          <button
            onClick={onClose}
            className="text-grey-400 hover:text-grey-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {cardData && !loading && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Card Image */}
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm">
                  {getCardImage() && (
                    <Image
                      src={getCardImage()!}
                      alt={getCardName()}
                      width={300}
                      height={420}
                      className="w-full h-auto rounded-lg shadow-lg"
                      priority
                    />
                  )}
                </div>
              </div>

              {/* Card Details - Render based on card type */}
              <div className="space-y-4">
                {cardType === 'pokemon' && renderPokemonDetails(cardData as CardFull)}
                {/* Future: Add other card type renderers */}
                
                {/* Navigation between cards (if applicable) */}
                {(adjacentCards.prevCard || adjacentCards.nextCard) && (
                  <div className="flex items-center justify-between pt-4 border-t border-grey-200">
                    <button
                      onClick={() => adjacentCards.prevCard && onClose()}
                      disabled={!adjacentCards.prevCard}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        adjacentCards.prevCard
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-grey-300 cursor-not-allowed'
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() => adjacentCards.nextCard && onClose()}
                      disabled={!adjacentCards.nextCard}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        adjacentCards.nextCard
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-grey-300 cursor-not-allowed'
                      }`}
                    >
                      <span>Next</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Pokemon-specific renderer
function renderPokemonDetails(card: CardFull) {
  // Build variants array from boolean fields
  const variants: string[] = []
  if (card.variant_normal) variants.push('Normal')
  if (card.variant_holo) variants.push('Holo')
  if (card.variant_reverse) variants.push('Reverse')
  if (card.variant_first_edition) variants.push('1st Edition')
  
  return (
    <>
      <div>
        <h3 className="text-lg font-bold text-grey-900 mb-2">{card.name}</h3>
        <p className="text-sm text-grey-600">
          {card.set?.name || 'Unknown Set'} • {card.local_id || 'No Number'}
        </p>
      </div>

      {/* Card Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        {card.category && (
          <div>
            <p className="text-sm font-medium text-grey-500">Category</p>
            <p className="text-sm text-grey-900">{card.category}</p>
          </div>
        )}
        
        {card.rarity && (
          <div>
            <p className="text-sm font-medium text-grey-500">Rarity</p>
            <p className="text-sm text-grey-900">{card.rarity}</p>
          </div>
        )}

        {card.illustrator && (
          <div>
            <p className="text-sm font-medium text-grey-500">Illustrator</p>
            <p className="text-sm text-grey-900">{card.illustrator}</p>
          </div>
        )}

        {variants.length > 0 && (
          <div>
            <p className="text-sm font-medium text-grey-500">Variants</p>
            <p className="text-sm text-grey-900">
              {variants.join(', ')}
            </p>
          </div>
        )}
      </div>
    </>
  )
}

// Future: Add other card type renderers
// function renderOnePieceDetails(card: OnePieceCard) { ... }
// function renderSportsDetails(card: SportsCard) { ... }