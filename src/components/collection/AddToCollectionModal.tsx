'use client'

import { useEffect } from 'react'
import AddToCollectionForm from './AddToCollectionForm'

interface AddToCollectionModalProps {
  isOpen: boolean
  onClose: () => void
  cardId: string
  cardName: string
  availableVariants: string[]
  onSuccess: (message: string) => void
  onError: (error: string) => void
}

export default function AddToCollectionModal({
  isOpen,
  onClose,
  cardId,
  cardName,
  availableVariants,
  onSuccess,
  onError
}: AddToCollectionModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      return () => {
        document.documentElement.style.overflow = ''
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 bg-white border-b border-grey-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-grey-900">
              Add to Collection
            </h2>
            <button
              onClick={onClose}
              className="text-grey-400 hover:text-grey-600 transition-colors p-1"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AddToCollectionForm
              cardId={cardId}
              cardName={cardName}
              availableVariants={availableVariants}
              onSuccess={onSuccess}
              onError={onError}
              onClose={onClose}
              mode="modal"
            />
          </div>
        </div>
      </div>
    </>
  )
}