'use client'

import { useState } from 'react'

interface DeleteBinderDialogProps {
  isOpen: boolean
  binderName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteBinderDialog({
  isOpen,
  binderName,
  onConfirm,
  onCancel
}: DeleteBinderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h3 className="text-lg font-semibold text-grey-900">
            Delete Binder?
          </h3>
          <p className="mt-2 text-sm text-grey-600">
            Are you sure you want to delete <span className="font-medium">{binderName}</span>?
          </p>
          <p className="mt-1 text-sm text-grey-500">
            Cards in this binder will not be deleted from your collection.
          </p>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-grey-300 text-grey-700 text-sm font-medium rounded-md hover:bg-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
