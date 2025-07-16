'use client'

import { useEffect, useState } from 'react'
import { useCardActions } from '@/hooks/useCardActions'
import CardImageDisplay from './CardImageDisplay'
import CardGradeSummary from './CardGradeSummary'
import CardInfoPanel from './CardInfoPanel'
import CardIdentificationModal from './CardIdentificationModal'

interface CardDetailsProps {
  cardId: string
  onBack: () => void
}

export default function CardDetails({ cardId, onBack }: CardDetailsProps) {
  const { card, loading, error, deleting, deleteCard, loadCard } = useCardActions(cardId)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadCard()
  }, [loadCard])

  const handleDelete = async () => {
    if (!card || !confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return
    }

    const success = await deleteCard()
    if (success) {
      onBack()
    }
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
    // Refresh card data after edit
    loadCard()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <div className="space-x-3">
          <button
            onClick={loadCard}
            className="text-orange-600 hover:text-orange-500"
          >
            Try again
          </button>
          <button
            onClick={onBack}
            className="text-grey-600 hover:text-grey-500"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <div className="text-grey-600 mb-4">Card not found</div>
        <button
          onClick={onBack}
          className="text-orange-600 hover:text-orange-500"
        >
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-grey-400 hover:text-grey-600 rounded-md"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-grey-900">
            {card.card_title || 'Card Details'}
          </h1>
        </div>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
              Deleting...
            </>
          ) : (
            <>
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Card
            </>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Images */}
        <div className="lg:col-span-2">
          <CardImageDisplay card={card} />
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          <CardGradeSummary card={card} />
          <CardInfoPanel 
            card={card} 
            onEdit={() => setShowEditModal(true)} 
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CardIdentificationModal
          isOpen={showEditModal}
          onClose={handleEditModalClose}
          onConfirm={handleEditModalClose}
          cardId={card.id}
          identificationData={{
            full_name: card.card_title || '',
            set: card.card_set || '',
            rarity: card.rarity || '',
            out_of: card.out_of || '',
            card_number: card.card_number || '',
            set_series_code: card.set_series_code || '',
            set_code: card.set_code || '',
            series: card.series || '',
            year: card.year?.toString() || '',
            subcategory: card.subcategory || '',
            links: (card.links as Record<string, string>) || undefined
          }}
          analyzeSuccess={true}
          analyzeMessage={null}
          estimatedGrade={card.estimated_grade}
        />
      )}
    </div>
  )
}