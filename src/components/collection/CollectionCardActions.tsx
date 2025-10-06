'use client'

import { useState, useEffect } from 'react'
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

  // Reset edit state when navigating to a different card
  useEffect(() => {
    setIsEditing(false)
  }, [card.id])

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
    <div className="flex gap-3">
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
  )
}