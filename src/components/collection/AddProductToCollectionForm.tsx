'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Sealed product condition options
 */
const PRODUCT_CONDITION_OPTIONS = [
  { value: 'sealed', label: 'Sealed' },
  { value: 'opened', label: 'Opened' },
  { value: 'damaged', label: 'Damaged' }
] as const

interface AddProductToCollectionFormProps {
  productId: number
  productName: string
  onSuccess: (message: string) => void
  onError: (error: string) => void
  onClose?: () => void
  mode?: 'modal' | 'inline'
}

interface FormData {
  quantity: number
  condition: string
  purchase_price: string
  purchased_at: string
  notes: string
}

export default function AddProductToCollectionForm({
  productId,
  productName,
  onSuccess,
  onError,
  onClose,
  mode = 'modal'
}: AddProductToCollectionFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    quantity: 1,
    condition: 'sealed',
    purchase_price: '',
    purchased_at: '',
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
      onError('Please sign in to add products to your collection')
      return
    }

    if (formData.quantity < 1) {
      onError('Quantity must be at least 1')
      return
    }

    setIsSubmitting(true)

    try {
      const requestData = {
        pokemon_product_id: productId,
        quantity: formData.quantity,
        condition: formData.condition,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : undefined,
        purchased_at: formData.purchased_at || undefined,
        notes: formData.notes || undefined
      }

      const response = await fetch('/api/collection/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add product to collection')
      }

      onSuccess(result.message || 'Product added to collection successfully')

      // Reset form
      setFormData({
        quantity: 1,
        condition: 'sealed',
        purchase_price: '',
        purchased_at: '',
        notes: ''
      })

      // Close modal/dialog if applicable
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error adding product to collection:', error)
      onError(error instanceof Error ? error.message : 'Failed to add product to collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isInlineMode = mode === 'inline'
  const containerClasses = isInlineMode ? 'space-y-4' : 'space-y-6'

  return (
    <form onSubmit={handleSubmit} className={containerClasses}>
      {!isInlineMode && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-grey-900 mb-2">
            Add to Collection
          </h3>
          <p className="text-sm text-grey-600 line-clamp-2">
            Adding &ldquo;{productName}&rdquo; to your collection
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* Row 1: Condition | Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-grey-700 mb-1">
              Condition
            </label>
            <select
              id="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange('condition', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {PRODUCT_CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-grey-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
          </div>
        </div>

        {/* Row 2: Price Paid | Purchase Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="purchase_price" className="block text-sm font-medium text-grey-700 mb-1">
              Price Paid
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-grey-500 text-sm">$</span>
              <input
                type="number"
                id="purchase_price"
                step="0.01"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="purchased_at" className="block text-sm font-medium text-grey-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              id="purchased_at"
              value={formData.purchased_at}
              onChange={(e) => handleInputChange('purchased_at', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Row 3: Notes (Full Width) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-grey-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            rows={2}
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Optional notes..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className={`flex gap-3 ${isInlineMode ? 'pt-2' : 'pt-4'}`}>
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
          disabled={isSubmitting}
          className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add to Collection'}
        </button>
      </div>
    </form>
  )
}
