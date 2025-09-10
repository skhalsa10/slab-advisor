'use client'

import { useState } from 'react'
import type { CollectionCard } from '@/types/database'
import { CONDITION_OPTIONS } from '@/constants/cards'

interface EditCollectionFormProps {
  card: CollectionCard
  onSave: (updates: Partial<CollectionCard>) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export default function EditCollectionForm({
  card,
  onSave,
  onCancel,
  isSubmitting = false
}: EditCollectionFormProps) {
  const [formData, setFormData] = useState({
    quantity: card.quantity || 1,
    condition: card.condition || '',
    acquisition_price: card.acquisition_price?.toString() || '',
    acquisition_date: card.acquisition_date || '',
    notes: card.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1'
    }

    if (formData.acquisition_price && isNaN(parseFloat(formData.acquisition_price))) {
      newErrors.acquisition_price = 'Price must be a valid number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const updates: Partial<CollectionCard> = {
      quantity: formData.quantity,
      condition: formData.condition || null,
      acquisition_price: formData.acquisition_price ? parseFloat(formData.acquisition_price) : null,
      acquisition_date: formData.acquisition_date || null,
      notes: formData.notes || null
    }

    await onSave(updates)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-grey-700 mb-1">
          Quantity
        </label>
        <input
          type="number"
          id="quantity"
          min="1"
          value={formData.quantity}
          onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
            errors.quantity ? 'border-red-500' : 'border-grey-300'
          }`}
          disabled={isSubmitting}
        />
        {errors.quantity && (
          <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
        )}
      </div>

      {/* Condition */}
      <div>
        <label htmlFor="condition" className="block text-sm font-medium text-grey-700 mb-1">
          Condition
        </label>
        <select
          id="condition"
          value={formData.condition}
          onChange={(e) => handleInputChange('condition', e.target.value)}
          className="w-full px-3 py-2 border border-grey-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={isSubmitting}
        >
          {CONDITION_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Acquisition Price */}
      <div>
        <label htmlFor="acquisition_price" className="block text-sm font-medium text-grey-700 mb-1">
          Purchase Price
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey-500">$</span>
          <input
            type="text"
            id="acquisition_price"
            placeholder="0.00"
            value={formData.acquisition_price}
            onChange={(e) => handleInputChange('acquisition_price', e.target.value)}
            className={`w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              errors.acquisition_price ? 'border-red-500' : 'border-grey-300'
            }`}
            disabled={isSubmitting}
          />
        </div>
        {errors.acquisition_price && (
          <p className="mt-1 text-xs text-red-600">{errors.acquisition_price}</p>
        )}
      </div>

      {/* Acquisition Date */}
      <div>
        <label htmlFor="acquisition_date" className="block text-sm font-medium text-grey-700 mb-1">
          Purchase Date
        </label>
        <input
          type="date"
          id="acquisition_date"
          value={formData.acquisition_date}
          onChange={(e) => handleInputChange('acquisition_date', e.target.value)}
          className="w-full px-3 py-2 border border-grey-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          disabled={isSubmitting}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-grey-700 mb-1">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Add any notes about this card..."
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="w-full px-3 py-2 border border-grey-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          disabled={isSubmitting}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-grey-300 text-grey-700 text-sm font-medium rounded-md hover:bg-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}