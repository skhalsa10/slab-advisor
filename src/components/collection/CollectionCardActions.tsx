'use client'

import { useState } from 'react'
import { getConditionLabel } from '@/constants/cards'
import EditCollectionForm from './EditCollectionForm'
import type { CollectionCardWithPokemon } from '@/utils/collectionCardUtils'

interface CollectionCardActionsProps {
  card: CollectionCardWithPokemon
  onUpdate: (updatedCard: CollectionCardWithPokemon) => void
  onDelete: () => void
  onError: (error: string) => void
}

export default function CollectionCardActions({
  card,
  onUpdate,
  onDelete,
  onError
}: CollectionCardActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (updates: Partial<CollectionCardWithPokemon>) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/collection/cards/${card.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update card')
      }

      onUpdate(result.data)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating card:', error)
      onError(error instanceof Error ? error.message : 'Failed to update card')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Not specified'
    return `$${price.toFixed(2)}`
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-grey-900">Edit Card Details</h4>
        <EditCollectionForm
          card={card}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Card Metadata Display */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-grey-900">Collection Details</h4>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="font-medium text-grey-500">Quantity</p>
            <p className="text-grey-900">{card.quantity || 1}</p>
          </div>
          
          <div>
            <p className="font-medium text-grey-500">Condition</p>
            <p className="text-grey-900">
              {card.condition ? getConditionLabel(card.condition) : 'Not specified'}
            </p>
          </div>

          <div>
            <p className="font-medium text-grey-500">Purchase Price</p>
            <p className="text-grey-900">{formatPrice(card.acquisition_price)}</p>
          </div>

          <div>
            <p className="font-medium text-grey-500">Purchase Date</p>
            <p className="text-grey-900">{formatDate(card.acquisition_date)}</p>
          </div>

          {card.notes && (
            <div className="col-span-2">
              <p className="font-medium text-grey-500">Notes</p>
              <p className="text-grey-900 whitespace-pre-wrap">{card.notes}</p>
            </div>
          )}

          <div className="col-span-2">
            <p className="font-medium text-grey-500">Added to Collection</p>
            <p className="text-grey-900">{formatDate(card.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-3 border-t border-grey-200">
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Edit Details
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-4 py-2 border border-red-600 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
        >
          Remove from Collection
        </button>
      </div>
    </div>
  )
}