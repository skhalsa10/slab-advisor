'use client'

import { useState } from 'react'
import Image from 'next/image'
import CollectionCardActions from '@/components/collection/CollectionCardActions'
import DeleteCardDialog from '@/components/collection/DeleteCardDialog'
import { OwnedVariantPriceDisplay } from '@/components/collection/OwnedVariantPriceDisplay'
import type { CardFull } from '@/models/pokemon'
import type { CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { getCardDisplayName, getCardImageUrl } from '@/utils/collectionCardUtils'
import { extractMarketPrices } from '@/utils/priceUtils'

interface CollectionQuickViewContentProps {
  card: CollectionCardWithPokemon
  onUpdate?: (updatedCard: CollectionCardWithPokemon) => void
  onDelete?: () => void
  onClose?: () => void
}

/**
 * CollectionQuickViewContent Component
 * 
 * Displays collection card details with edit/delete actions.
 * This component focuses on content only - layout is handled by QuickView wrapper.
 * Used in the collection page for viewing and managing cards in the user's collection.
 */
export default function CollectionQuickViewContent({
  card,
  onUpdate,
  onDelete,
  onClose
}: CollectionQuickViewContentProps) {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleDeleteCard = async () => {
    try {
      const response = await fetch(`/api/collection/cards/${card.id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to delete card')
      }

      setShowDeleteDialog(false)
      onDelete?.()
      onClose?.()
    } catch (error) {
      console.error('Error deleting card:', error)
      setErrorMessage('Failed to delete card from collection')
      setShowDeleteDialog(false)
    }
  }

  const handleUpdateCard = (updatedCard: CollectionCardWithPokemon) => {
    onUpdate?.(updatedCard)
    setSuccessMessage('Card updated successfully')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const pokemonCard = card.pokemon_card as CardFull | null

  return (
    <>
      <div className="p-4">
        {/* Responsive layout: 
            - Always single column on mobile (bottom sheet)
            - Two columns on tablet/modal (md:flex-row) 
            - Single column on desktop/sidesheet (lg:flex-col)
        */}
        <div className="flex flex-col md:flex-row md:gap-4 lg:flex-col lg:gap-0">
          {/* Card Image */}
          <div className="flex justify-center md:flex-shrink-0 mb-4">
            <div className="relative w-48 md:w-40 lg:w-full lg:max-w-64">
              <Image
                src={getCardImageUrl(card)}
                alt={getCardDisplayName(card)}
                width={240}
                height={336}
                className="w-full h-auto rounded-lg shadow-md"
                priority
              />
            </div>
          </div>

          {/* Card Details */}
          <div className="flex-1 space-y-4">
            {/* Card Information */}
            {pokemonCard && (
              <PokemonDetailsCollection
                card={pokemonCard}
                variant={card.variant}
                variantPattern={card.variant_pattern}
                quantity={card.quantity || 1}
              />
            )}
            
            {/* Collection-specific Details */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold text-grey-900 mb-2">📦 Collection Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-grey-600">Quantity</span>
                  <span className="font-medium">{card.quantity || 1}</span>
                </div>
                {card.variant && (
                  <div className="flex justify-between">
                    <span className="text-grey-600">Variant</span>
                    <span className="font-medium capitalize">
                      {card.variant.replace('_', ' ')}
                    </span>
                  </div>
                )}
                {card.condition && (
                  <div className="flex justify-between">
                    <span className="text-grey-600">Condition</span>
                    <span className="font-medium">{card.condition}</span>
                  </div>
                )}
                {card.acquisition_price !== null && (
                  <div className="flex justify-between">
                    <span className="text-grey-600">Purchase Price</span>
                    <span className="font-medium text-green-600">
                      ${card.acquisition_price.toFixed(2)}
                    </span>
                  </div>
                )}
                {card.acquisition_date && (
                  <div className="flex justify-between">
                    <span className="text-grey-600">Purchase Date</span>
                    <span className="font-medium">
                      {new Date(card.acquisition_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {card.created_at && (
                  <div className="flex justify-between">
                    <span className="text-grey-600">Added to Collection</span>
                    <span className="font-medium">
                      {new Date(card.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {card.notes && (
                  <div>
                    <span className="text-grey-600">Notes</span>
                    <p className="mt-1 text-grey-900">{card.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Success/Error Messages */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <CollectionCardActions
              card={card}
              onUpdate={handleUpdateCard}
              onDelete={() => setShowDeleteDialog(true)}
              onError={setErrorMessage}
            />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteCardDialog
        card={card}
        isOpen={showDeleteDialog}
        onConfirm={handleDeleteCard}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  )
}

// Pokemon-specific details renderer for collection context
function PokemonDetailsCollection({
  card,
  variant,
  variantPattern,
  quantity,
}: {
  card: CardFull
  variant: string
  variantPattern?: string | null
  quantity: number
}) {
  const variants: string[] = []
  if (card.variant_normal) variants.push('Normal')
  if (card.variant_holo) variants.push('Holo')
  if (card.variant_reverse) variants.push('Reverse')
  if (card.variant_first_edition) variants.push('1st Edition')

  // Get the price for the specific variant the user owns
  const getVariantPrice = (): number | null => {
    if (!card.price_data) return null

    const prices = extractMarketPrices(card.price_data)
    if (!prices) return null

    // Map collection variant to price variant names
    const variantMap: Record<string, string[]> = {
      'normal': ['Normal'],
      'holo': ['Holofoil', 'Holo'],
      'reverse_holo': ['Reverse Holofoil', 'Reverse'],
      'first_edition': ['1st Edition Normal', '1st Edition Holofoil', '1st Edition']
    }

    const targetPattern = variantPattern || 'base'
    const priceVariantNames = variantMap[variant] || []

    // Try to find price with pattern suffix first
    for (const variantName of priceVariantNames) {
      if (targetPattern !== 'base') {
        const patternMap: Record<string, string> = {
          'poke_ball': '(Poké Ball)',
          'master_ball': '(Master Ball)',
          'great_ball': '(Great Ball)',
          'ultra_ball': '(Ultra Ball)',
        }
        const patternSuffix = patternMap[targetPattern]
        if (patternSuffix) {
          const keyWithPattern = `${variantName} ${patternSuffix}`
          if (prices[keyWithPattern] && prices[keyWithPattern] > 0) {
            return prices[keyWithPattern]
          }
        }
      }

      // Try base variant name (without pattern)
      if (prices[variantName] && prices[variantName] > 0) {
        return prices[variantName]
      }
    }

    // Fallback to lowest available price
    const allPrices = Object.values(prices).filter(price => price > 0)
    return allPrices.length > 0 ? Math.min(...allPrices) : null
  }

  const variantPrice = getVariantPrice()

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-grey-900 mb-1">{card.name}</h3>
        <p className="text-sm text-grey-600">
          {card.set?.name || 'Unknown Set'} • #{card.local_id || 'No Number'}
        </p>
      </div>

      {/* Card Info - Responsive grid */}
      <div className="grid grid-cols-2 gap-3 text-sm lg:space-y-2 lg:block">
        {card.category && (
          <div className="lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Category</p>
            <p className="text-grey-900">{card.category}</p>
          </div>
        )}

        {card.rarity && (
          <div className="lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Rarity</p>
            <p className="text-grey-900">{card.rarity}</p>
          </div>
        )}

        {card.illustrator && (
          <div className="col-span-2 lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Illustrator</p>
            <p className="text-grey-900 lg:truncate lg:ml-2">{card.illustrator}</p>
          </div>
        )}

        {variants.length > 0 && (
          <div className="col-span-2 lg:flex lg:justify-between">
            <p className="font-medium text-grey-500">Variants</p>
            <p className="text-grey-900 lg:text-right lg:ml-2">
              {variants.join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Owned Variant Price Display */}
      {variantPrice !== null && (
        <OwnedVariantPriceDisplay
          price={variantPrice}
          variant={variant}
          variantPattern={variantPattern}
          quantity={quantity}
        />
      )}

      {variantPrice === null && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-grey-500 italic text-center">
            Price data unavailable for this variant
          </p>
        </div>
      )}
    </div>
  )
}