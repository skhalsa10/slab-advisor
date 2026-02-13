'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface DeleteDataDialogProps {
  isOpen: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
  error?: string | null
}

const REQUIRED_CONFIRMATION = 'DELETE'

export default function DeleteDataDialog({
  isOpen,
  onConfirm,
  onCancel,
  error,
}: DeleteDataDialogProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmationValid = confirmationText === REQUIRED_CONFIRMATION

  const handleConfirm = async () => {
    if (!isConfirmationValid) return

    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
      setConfirmationText('')
    }
  }

  const handleCancel = () => {
    setConfirmationText('')
    onCancel()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-lg shadow-xl p-6">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-grey-900">
                Delete All Your Data?
              </h3>
              <p className="mt-2 text-sm text-grey-600">
                This will permanently delete:
              </p>
              <ul className="mt-1 text-sm text-grey-600 list-disc list-inside">
                <li>All your collection cards and their images</li>
                <li>All card gradings</li>
                <li>All sealed products</li>
                <li>Your portfolio history</li>
                <li>Your profile information (display name, bio, avatar)</li>
              </ul>
            </div>
          </div>

          {/* What's preserved notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Your account will remain active.</strong> Your username, credits, and settings will be preserved.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800 font-medium">
              This action cannot be undone.
            </p>
          </div>

          {/* Confirmation input */}
          <div className="mb-4">
            <label htmlFor="confirmation" className="block text-sm font-medium text-grey-700 mb-1">
              Type <span className="font-mono bg-grey-100 px-1 rounded">DELETE</span> to confirm
            </label>
            <input
              id="confirmation"
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="DELETE"
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-grey-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-grey-100 disabled:cursor-not-allowed"
              autoComplete="off"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-grey-300 text-grey-700 text-sm font-medium rounded-md hover:bg-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isConfirmationValid || isDeleting}
              className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete My Data'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
