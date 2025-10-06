'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { CONDITION_OPTIONS } from '@/constants/cards'
import { getVariantLabel, parseVariantSelection } from '@/utils/variantUtils'

interface AddToCollectionFormProps {
  cardId: string
  cardName: string
  availableVariants: string[]
  onSuccess: (message: string) => void
  onError: (error: string) => void
  onClose?: () => void
  mode?: 'modal' | 'inline' | 'transform'
}

interface FormData {
  variant: string
  quantity: number
  condition: string
  acquisition_price: string
  acquisition_date: string
  notes: string
}

export default function AddToCollectionForm({
  cardId,
  cardName,
  availableVariants,
  onSuccess,
  onError,
  onClose,
  mode = 'modal'
}: AddToCollectionFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    variant: availableVariants[0] || '',
    quantity: 1,
    condition: '',
    acquisition_price: '',
    acquisition_date: '',
    notes: ''
  })

  const handleInputChange = (
    field: keyof FormData,
    value: string | number
  ) => {
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
        condition: formData.condition || undefined,
        acquisition_price: formData.acquisition_price ? parseFloat(formData.acquisition_price) : undefined,
        acquisition_date: formData.acquisition_date || undefined,
        notes: formData.notes || undefined
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

      onSuccess(result.message || 'Card added to collection successfully')
      
      // Reset form
      setFormData({
        variant: availableVariants[0] || '',
        quantity: 1,
        condition: '',
        acquisition_price: '',
        acquisition_date: '',
        notes: ''
      })

      // Close modal/dialog if applicable
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error adding card to collection:', error)
      onError(error instanceof Error ? error.message : 'Failed to add card to collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isTransformMode = mode === 'transform'
  const containerClasses = isTransformMode 
    ? 'space-y-4' 
    : 'space-y-6'

  return (
    <form onSubmit={handleSubmit} className={containerClasses}>
      {!isTransformMode && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-grey-900 mb-2">
            Add to Collection
          </h3>
          <p className="text-sm text-grey-600">
            Adding &ldquo;{cardName}&rdquo; to your collection
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Variant Selection */}
        <div>
          <label htmlFor="variant" className="block text-sm font-medium text-grey-700 mb-2">
            Variant *
          </label>
          <select
            id="variant"
            value={formData.variant}
            onChange={(e) => handleInputChange('variant', e.target.value)}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          >
            <option value="">Select Variant</option>
            {availableVariants.map((variant) => (
              <option key={variant} value={variant}>
                {getVariantLabel(variant)}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-grey-700 mb-2">
            Quantity *
          </label>
          <input
            type="number"
            id="quantity"
            min="1"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            required
          />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="condition" className="block text-sm font-medium text-grey-700 mb-2">
            Condition
          </label>
          <select
            id="condition"
            value={formData.condition}
            onChange={(e) => handleInputChange('condition', e.target.value)}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Acquisition Price */}
        <div>
          <label htmlFor="acquisition_price" className="block text-sm font-medium text-grey-700 mb-2">
            Purchase Price
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-grey-500">$</span>
            <input
              type="number"
              id="acquisition_price"
              step="0.01"
              min="0"
              value={formData.acquisition_price}
              onChange={(e) => handleInputChange('acquisition_price', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Acquisition Date */}
        <div>
          <label htmlFor="acquisition_date" className="block text-sm font-medium text-grey-700 mb-2">
            Purchase Date
          </label>
          <input
            type="date"
            id="acquisition_date"
            value={formData.acquisition_date}
            onChange={(e) => handleInputChange('acquisition_date', e.target.value)}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-grey-700 mb-2">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Optional notes about this card..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className={`flex gap-3 ${isTransformMode ? 'pt-2' : 'pt-4'}`}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-grey-300 text-grey-700 rounded-md hover:bg-grey-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || !formData.variant}
          className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add to Collection'}
        </button>
      </div>
    </form>
  )
}