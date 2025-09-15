'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getCardImageUrl } from '@/lib/pokemon-db'
import type { SearchResult } from '@/hooks/useQuickAdd'

interface SearchResultCardProps {
  card: SearchResult
  onAddToCollection: (cardId: string, variant: string, quantity: number) => Promise<boolean>
  isAdding?: boolean
}

/**
 * SearchResultCard Component
 * 
 * Displays a search result card with image, name, set info, and add to collection button.
 * Handles variant selection and quantity input for adding cards to collection.
 * 
 * @param card - The search result card data
 * @param onAddToCollection - Callback when user adds card to collection
 * @param isAdding - Whether this card is currently being added
 */
export default function SearchResultCard({
  card,
  onAddToCollection,
  isAdding = false
}: SearchResultCardProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [variant, setVariant] = useState('normal')
  const [quantity, setQuantity] = useState(1)
  const [localAdding, setLocalAdding] = useState(false)

  const cardImageUrl = getCardImageUrl(
    card.image,
    'low', // Use low quality for search results for faster loading
    card.tcgplayer_image_url
  )

  const handleAddClick = () => {
    if (showAddForm) {
      // Already showing form, hide it
      setShowAddForm(false)
    } else {
      // Show the add form
      setShowAddForm(true)
    }
  }

  const handleConfirmAdd = async () => {
    setLocalAdding(true)
    
    try {
      const success = await onAddToCollection(card.id, variant, quantity)
      
      if (success) {
        // Success - reset form and hide it
        setShowAddForm(false)
        setVariant('normal')
        setQuantity(1)
      }
      // If failed, keep form open so user can try again
    } finally {
      setLocalAdding(false)
    }
  }

  const isCurrentlyAdding = isAdding || localAdding

  return (
    <div className="bg-white rounded-lg border border-grey-200 hover:border-grey-300 transition-all duration-200 overflow-hidden">
      {/* Card Image */}
      <div className="aspect-[3/4] relative bg-grey-100">
        <Image
          src={cardImageUrl}
          alt={card.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {/* Card Info */}
      <div className="p-3 space-y-2">
        {/* Card Name */}
        <h3 className="font-semibold text-grey-900 text-sm leading-tight line-clamp-1" title={card.name}>
          {card.name}
        </h3>
        
        {/* Set Name */}
        <div className="text-xs text-grey-600 truncate" title={card.set_name}>
          {card.set_name}
        </div>
        
        {/* Number and Rarity Row */}
        <div className="flex items-center gap-2">
          {card.local_id && (
            <span className="text-xs font-mono text-grey-600">
              #{card.local_id}
            </span>
          )}
          {card.rarity && (
            <span className="text-xs text-orange-600 capitalize">
              {card.rarity}
            </span>
          )}
        </div>
        

        {/* Add to Collection Button */}
        {!showAddForm ? (
            <button
              onClick={handleAddClick}
              disabled={isCurrentlyAdding}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-grey-400 
                         text-white text-sm font-medium py-2.5 px-3 rounded-lg
                         transition-all duration-200 flex items-center justify-center
                         hover:shadow-md active:scale-95"
              aria-label={`Add ${card.name} from ${card.set_name} to collection`}
            >
              {isCurrentlyAdding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add to Collection</span>
                </>
              )}
            </button>
        ) : (
          <div className="space-y-2">
            {/* Variant Selection */}
            <div>
              <label className="block text-xs font-medium text-grey-700 mb-1">
                Variant:
              </label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full text-xs border border-grey-300 rounded px-2 py-1 
                           focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="normal">Normal</option>
                <option value="reverse">Reverse Holo</option>
                <option value="holo">Holo</option>
                <option value="first_edition">First Edition</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-grey-700 mb-1">
                Quantity:
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs border border-grey-300 rounded px-2 py-1 
                           focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleConfirmAdd}
                disabled={isCurrentlyAdding}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-grey-400 
                           text-white text-xs font-medium py-1.5 px-2 rounded 
                           transition-colors duration-200"
              >
                {isCurrentlyAdding ? 'Adding...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                disabled={isCurrentlyAdding}
                className="flex-1 bg-grey-500 hover:bg-grey-600 disabled:bg-grey-400 
                           text-white text-xs font-medium py-1.5 px-2 rounded 
                           transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}