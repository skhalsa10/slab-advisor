'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import DeleteDataDialog from './DeleteDataDialog'
import { trackUserDataDeleted } from '@/lib/posthog/events'

export default function DangerZoneSection() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteData = async () => {
    setError(null)

    try {
      const response = await fetch('/api/profile/delete-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE ALL MY DATA' }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete data')
      }

      // Track successful deletion in PostHog
      trackUserDataDeleted({
        cardsDeleted: data.counts?.cardsDeleted || 0,
        gradingsDeleted: data.counts?.gradingsDeleted || 0,
        productsDeleted: data.counts?.productsDeleted || 0,
        snapshotsDeleted: data.counts?.snapshotsDeleted || 0,
      })

      // Close dialog and refresh the page to reflect changes
      setIsDialogOpen(false)
      window.location.reload()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-red-200 mb-6">
        <div className="px-4 py-3 border-b border-red-200 bg-red-50">
          <h2 className="text-sm font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium text-grey-900">Delete All My Data</h3>
              <p className="text-sm text-grey-600 mt-1">
                Permanently delete all your collection data, gradings, and profile information.
                Your account, username, credits, and settings will be preserved.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDialogOpen(true)}
              className="flex-shrink-0 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Data
            </button>
          </div>
        </div>
      </div>

      <DeleteDataDialog
        isOpen={isDialogOpen}
        onConfirm={handleDeleteData}
        onCancel={() => {
          setIsDialogOpen(false)
          setError(null)
        }}
        error={error}
      />
    </>
  )
}
