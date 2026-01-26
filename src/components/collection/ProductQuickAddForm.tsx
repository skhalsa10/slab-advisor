'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { PRODUCT_CONDITION_OPTIONS } from '@/constants/products'

interface ProductQuickAddFormProps {
  productId: string
  productName: string
  productImage?: string
  onSuccess: (message: string) => void
  onError: (error: string) => void
  onClose: () => void
}

interface FormData {
  quantity: number
  condition: string
}

export default function ProductQuickAddForm({
  productId,
  productName,
  productImage,
  onSuccess,
  onError,
  onClose
}: ProductQuickAddFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    quantity: 1,
    condition: 'sealed' // Default to Sealed for products
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
        pokemon_product_id: parseInt(productId),
        quantity: formData.quantity,
        condition: formData.condition
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

      onSuccess(result.message || `Added ${productName} to collection`)
    } catch (error) {
      console.error('Error adding product to collection:', error)
      onError(error instanceof Error ? error.message : 'Failed to add product to collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Preview */}
      <div className="flex items-center gap-3 pb-3 border-b border-grey-200">
        {productImage && (
          <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-grey-100">
            <Image
              src={productImage}
              alt={productName}
              fill
              className="object-contain"
              sizes="48px"
            />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-grey-900 truncate">{productName}</h3>
          <p className="text-xs text-grey-500">Add to your collection</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        {/* Quantity */}
        <div>
          <label htmlFor="product-quick-quantity" className="block text-sm font-medium text-grey-700 mb-1">
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
              id="product-quick-quantity"
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
          <label htmlFor="product-quick-condition" className="block text-sm font-medium text-grey-700 mb-1">
            Condition
          </label>
          <select
            id="product-quick-condition"
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
          disabled={isSubmitting}
          className="flex-1 bg-orange-600 text-white py-2 px-3 text-sm rounded-md font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  )
}
