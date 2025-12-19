'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { CONDITION_OPTIONS } from '@/constants/cards'
import { getVariantLabel, parseVariantSelection } from '@/utils/variantUtils'

interface QuickAddFormProps {
  cardId: string
  cardName: string
  cardImage?: string
  availableVariants: string[]
  onSuccess: (message: string) => void
  onError: (error: string) => void
  onClose: () => void
}

interface FormData {
  variant: string
  quantity: number
  condition: string
}

export default function QuickAddForm({
  cardId,
  cardName,
  cardImage,
  availableVariants,
  onSuccess,
  onError,
  onClose
}: QuickAddFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    variant: availableVariants[0] || 'normal',
    quantity: 1,
    condition: 'near_mint' // Default to Near Mint
  })

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      onError('Please sign in to add cards to your collection')
      return
    }

    if (!formData.variant) {
      onError('Please select a variant')
      return
    }

    if (formData.quantity < 1) {
      onError('Quantity must be at least 1')
      return
    }

    setIsSubmitting(true)

    try {
      // Parse variant selection to extract variant and pattern
      const { variant, variant_pattern } = parseVariantSelection(formData.variant)

      const requestData = {
        mode: 'known-card' as const,
        pokemon_card_id: cardId,
        variant,
        variant_pattern,
        quantity: formData.quantity,
        condition: formData.condition || undefined
      }

      const response = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add card to collection')
      }

      onSuccess(result.message || `Added ${cardName} to collection`)
    } catch (error) {
      console.error('Error adding card to collection:', error)
      onError(error instanceof Error ? error.message : 'Failed to add card to collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter condition options to exclude the empty "Select Condition" option
  // since we're defaulting to Near Mint
  const conditionOptions = CONDITION_OPTIONS.filter(opt => opt.value !== '')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Preview */}
      <div className="flex items-center gap-3 pb-3 border-b border-grey-200">
        {cardImage && (
          <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-grey-100">
            <Image
              src={cardImage}
              alt={cardName}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-grey-900 truncate">{cardName}</h3>
          <p className="text-xs text-grey-500">Add to your collection</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Variant Selection */}
        <div>
          <label htmlFor="quick-variant" className="block text-sm font-medium text-grey-700 mb-1">
            Variant
          </label>
          <select
            id="quick-variant"
            value={formData.variant}
            onChange={(e) => handleInputChange('variant', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          >
            {availableVariants.map((variant) => (
              <option key={variant} value={variant}>
                {getVariantLabel(variant)}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quick-quantity" className="block text-sm font-medium text-grey-700 mb-1">
            Quantity
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleInputChange('quantity', Math.max(1, formData.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center border border-grey-300 rounded-md hover:bg-grey-50 transition-colors"
              disabled={formData.quantity <= 1}
            >
              <svg className="w-4 h-4 text-grey-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <input
              type="number"
              id="quick-quantity"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              className="w-16 px-3 py-2 text-sm text-center border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
            <button
              type="button"
              onClick={() => handleInputChange('quantity', formData.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center border border-grey-300 rounded-md hover:bg-grey-50 transition-colors"
            >
              <svg className="w-4 h-4 text-grey-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="quick-condition" className="block text-sm font-medium text-grey-700 mb-1">
            Condition
          </label>
          <select
            id="quick-condition"
            value={formData.condition}
            onChange={(e) => handleInputChange('condition', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {conditionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-3 py-2 text-sm border border-grey-300 text-grey-700 rounded-md hover:bg-grey-50 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.variant}
          className="flex-1 bg-orange-600 text-white py-2 px-3 text-sm rounded-md font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  )
}
