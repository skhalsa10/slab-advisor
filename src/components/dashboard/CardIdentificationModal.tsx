'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CardIdentificationData } from '@/types/card'

interface CardIdentificationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (cardId: string) => void
  cardId: string
  identificationData: CardIdentificationData | null
  analyzeSuccess: boolean
  analyzeMessage: string | null
  estimatedGrade: number | null
}

export default function CardIdentificationModal({
  isOpen,
  onConfirm,
  cardId,
  identificationData,
  analyzeSuccess,
  analyzeMessage,
  estimatedGrade
}: CardIdentificationModalProps) {
  const [isEditing, setIsEditing] = useState(!analyzeSuccess)
  const [saving, setSaving] = useState(false)
  const [editedData, setEditedData] = useState<CardIdentificationData>(
    identificationData || {
      card_set: null,
      rarity: null,
      full_name: null,
      out_of: null,
      card_number: null,
      set_series_code: null,
      set_code: null,
      series: null,
      year: null,
      subcategory: null,
      links: null
    }
  )

  if (!isOpen) return null

  const handleInputChange = (field: keyof CardIdentificationData, value: string | number | null) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLinksChange = (platform: 'tcgplayer.com' | 'ebay.com', value: string) => {
    setEditedData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [platform]: value || null
      }
    }))
  }

  const handleSave = async () => {
    if (isEditing) {
      setSaving(true)
      try {
        // Get the session token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          console.error('Authentication required')
          return
        }

        // Save edited data to database
        const response = await fetch('/api/update-card-details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ 
            cardId, 
            cardDetails: editedData 
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save card details')
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to save card details')
        }
      } catch (error) {
        console.error('Failed to save card details:', error)
        // Could add error handling here, but for now we'll continue
      } finally {
        setSaving(false)
      }
    }
    
    onConfirm(cardId)
  }

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return 'Not graded'
    return `${grade}/10`
  }

  const getGradeColor = (grade: number | null): string => {
    if (grade === null) return 'bg-grey-100 text-grey-800'
    if (grade >= 9) return 'bg-green-100 text-green-800'
    if (grade >= 7) return 'bg-yellow-100 text-yellow-800'
    if (grade >= 5) return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-grey-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-grey-900">Card Analysis Complete</h2>
            <button
              onClick={handleSave}
              className="text-grey-500 hover:text-grey-700"
              title="Save and continue"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Grade Display */}
          <div className="mb-6 text-center">
            <p className="text-sm text-grey-600 mb-2">Estimated Grade</p>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-xl font-bold ${getGradeColor(estimatedGrade)}`}>
              {formatGrade(estimatedGrade)}
            </span>
          </div>

          {/* Success/Error Message */}
          {analyzeMessage && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">{analyzeMessage}</p>
            </div>
          )}

          {/* Card Details Form */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-grey-900 mb-4">
              {isEditing ? 'Enter Card Details' : 'Card Identification'}
            </h3>

            {!isEditing && analyzeSuccess ? (
              /* Read-only view */
              <div className="space-y-3">
                {editedData.full_name && (
                  <div>
                    <span className="text-sm font-medium text-grey-700">Card Name:</span>
                    <p className="text-grey-900">{editedData.full_name}</p>
                  </div>
                )}
                {editedData.card_set && (
                  <div>
                    <span className="text-sm font-medium text-grey-700">Set:</span>
                    <p className="text-grey-900">{editedData.card_set}</p>
                  </div>
                )}
                {editedData.rarity && (
                  <div>
                    <span className="text-sm font-medium text-grey-700">Rarity:</span>
                    <p className="text-grey-900">{editedData.rarity}</p>
                  </div>
                )}
                {editedData.card_number && (
                  <div>
                    <span className="text-sm font-medium text-grey-700">Card Number:</span>
                    <p className="text-grey-900">
                      {editedData.card_number}
                      {editedData.out_of && ` / ${editedData.out_of}`}
                    </p>
                  </div>
                )}
                {editedData.year && (
                  <div>
                    <span className="text-sm font-medium text-grey-700">Year:</span>
                    <p className="text-grey-900">{editedData.year}</p>
                  </div>
                )}
                {editedData.links && (
                  <div>
                    <span className="text-sm font-medium text-grey-700">Market Links:</span>
                    <div className="flex gap-2 mt-1">
                      {editedData.links['tcgplayer.com'] && (
                        <a
                          href={editedData.links['tcgplayer.com']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-500 text-sm underline"
                        >
                          TCGPlayer
                        </a>
                      )}
                      {editedData.links['ebay.com'] && (
                        <a
                          href={editedData.links['ebay.com']}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 hover:text-orange-500 text-sm underline"
                        >
                          eBay
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Editable form */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Card Name
                  </label>
                  <input
                    type="text"
                    value={editedData.full_name || ''}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Pikachu Base Set 1st Edition #58"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Set
                  </label>
                  <input
                    type="text"
                    value={editedData.card_set || ''}
                    onChange={(e) => handleInputChange('card_set', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Base Set"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Rarity
                  </label>
                  <input
                    type="text"
                    value={editedData.rarity || ''}
                    onChange={(e) => handleInputChange('rarity', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Common, Rare, Holo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={editedData.card_number || ''}
                    onChange={(e) => handleInputChange('card_number', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 58"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Out of
                  </label>
                  <input
                    type="text"
                    value={editedData.out_of || ''}
                    onChange={(e) => handleInputChange('out_of', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 102"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Series
                  </label>
                  <input
                    type="text"
                    value={editedData.series || ''}
                    onChange={(e) => handleInputChange('series', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Base Set"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    value={editedData.year || ''}
                    onChange={(e) => handleInputChange('year', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 1999"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Set Code
                  </label>
                  <input
                    type="text"
                    value={editedData.set_code || ''}
                    onChange={(e) => handleInputChange('set_code', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., BS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Set Series Code
                  </label>
                  <input
                    type="text"
                    value={editedData.set_series_code || ''}
                    onChange={(e) => handleInputChange('set_series_code', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., base1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    value={editedData.subcategory || ''}
                    onChange={(e) => handleInputChange('subcategory', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Pokemon"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    TCGPlayer Link
                  </label>
                  <input
                    type="url"
                    value={editedData.links?.['tcgplayer.com'] || ''}
                    onChange={(e) => handleLinksChange('tcgplayer.com', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://www.tcgplayer.com/product/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-grey-700 mb-1">
                    eBay Link
                  </label>
                  <input
                    type="url"
                    value={editedData.links?.['ebay.com'] || ''}
                    onChange={(e) => handleLinksChange('ebay.com', e.target.value)}
                    className="w-full px-3 py-2 border border-grey-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://www.ebay.com/sch/..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-grey-200">
          <p className="text-xs text-grey-500 mb-4">
            💡 You can edit these details anytime from the card details page.
          </p>
          <div className="flex justify-end gap-3">
            {analyzeSuccess && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-grey-700 bg-white border border-grey-300 rounded-md hover:bg-grey-50"
              >
                Edit Details
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                isEditing ? 'Save & Continue' : 'Continue to Card Details'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}