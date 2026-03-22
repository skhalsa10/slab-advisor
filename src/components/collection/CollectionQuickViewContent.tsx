'use client'

import { useState } from 'react'
import Image from 'next/image'
import CollectionCardActions from '@/components/collection/CollectionCardActions'
import DeleteCardDialog from '@/components/collection/DeleteCardDialog'
import { OwnedVariantPriceDisplay } from '@/components/collection/OwnedVariantPriceDisplay'
import type { CardFull } from '@/models/pokemon'
import type { CollectionCardWithPokemon } from '@/utils/collectionCardUtils'
import { getCardDisplayName, getCardImageUrl } from '@/utils/collectionCardUtils'
import { getCollectionCardPrice } from '@/utils/collectionPriceUtils'
import { trackCardRemoved } from '@/lib/posthog/events'

const CONDITION_DISPLAY: Record<string, string> = {
  mint: 'Near Mint',
  near_mint: 'Near Mint',
  lightly_played: 'Lightly Played',
  moderately_played: 'Moderately Played',
  heavily_played: 'Heavily Played',
  damaged: 'Damaged',
}

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
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `Failed to delete card (${response.status})`
        console.error('Delete card error:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      trackCardRemoved({ cardId: card.id })
      setShowDeleteDialog(false)
      onDelete?.()
      onClose?.()
    } catch (error) {
      console.error('Error deleting card:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete card from collection')
      setShowDeleteDialog(false)
    }
  }

  const handleUpdateCard = (updatedCard: CollectionCardWithPokemon) => {
    onUpdate?.(updatedCard)
    setSuccessMessage('Card updated successfully')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const pokemonCard = card.pokemon_card as CardFull | null
  const variantPrice = getCollectionCardPrice(card)
  const priceCondition = CONDITION_DISPLAY[card.condition ?? ''] ?? 'Near Mint'

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
                price={variantPrice}
                priceCondition={priceCondition}
              />
            )}
            
            {/* Collection-specific Details */}
            <div className="border-t pt-3">
              <h4 className="text-sm font-semibold text-foreground mb-2">Your Collection</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{card.quantity || 1}</span>
                </div>
                {card.variant && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variant</span>
                    <span className="font-medium capitalize">
                      {(() => {
                        const baseVariant = card.variant.replace('_', ' ')
                        if (!card.variant_pattern || card.variant_pattern === 'base') {
                          return baseVariant
                        }
                        const patternMap: Record<string, string> = {
                          'poke_ball': 'Poké Ball',
                          'great_ball': 'Great Ball',
                          'ultra_ball': 'Ultra Ball',
                          'master_ball': 'Master Ball',
                        }
                        const pattern = patternMap[card.variant_pattern] || card.variant_pattern.replace('_', ' ')
                        return `${baseVariant} (${pattern})`
                      })()}
                    </span>
                  </div>
                )}
                {card.condition && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition</span>
                    <span className="font-medium">
                      {card.condition.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                  </div>
                )}
                {card.acquisition_price !== null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span className="font-medium text-green-600">
                      ${card.acquisition_price.toFixed(2)}
                    </span>
                  </div>
                )}
                {card.acquisition_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Date</span>
                    <span className="font-medium">
                      {new Date(card.acquisition_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {card.created_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added to Collection</span>
                    <span className="font-medium">
                      {new Date(card.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {card.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes</span>
                    <p className="mt-1 text-foreground">{card.notes}</p>
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
  price,
  priceCondition,
}: {
  card: CardFull
  variant: string
  variantPattern?: string | null
  quantity: number
  price: number | null
  priceCondition: string
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-foreground mb-1">{card.name}</h3>
        <p className="text-sm text-muted-foreground">
          {card.set?.name || 'Unknown Set'} • #{card.local_id || 'No Number'}
        </p>
      </div>

      {/* Card Info - Responsive grid */}
      <div className="grid grid-cols-2 gap-3 text-sm lg:space-y-2 lg:block">
        {card.category && (
          <div className="lg:flex lg:justify-between">
            <p className="font-medium text-muted-foreground">Category</p>
            <p className="text-foreground">{card.category}</p>
          </div>
        )}

        {card.rarity && (
          <div className="lg:flex lg:justify-between">
            <p className="font-medium text-muted-foreground">Rarity</p>
            <p className="text-foreground">{card.rarity}</p>
          </div>
        )}

        {card.illustrator && (
          <div className="col-span-2 lg:flex lg:justify-between">
            <p className="font-medium text-muted-foreground">Illustrator</p>
            <p className="text-foreground lg:truncate lg:ml-2">{card.illustrator}</p>
          </div>
        )}
      </div>

      {/* Owned Variant Price Display */}
      {price !== null ? (
        <OwnedVariantPriceDisplay
          price={price}
          condition={priceCondition}
          variant={variant}
          variantPattern={variantPattern}
          quantity={quantity}
        />
      ) : (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-muted-foreground italic text-center">
            Price data unavailable for this variant
          </p>
        </div>
      )}
    </div>
  )
}