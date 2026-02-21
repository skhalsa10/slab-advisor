'use client'

import { useState } from 'react'
import { FolderPlus, Plus } from 'lucide-react'
import type { Binder } from '@/types/database'

interface AddToBinderDialogProps {
  isOpen: boolean
  binders: Binder[]
  currentBinderId?: string
  selectedCount: number
  onConfirm: (binderId: string) => Promise<void>
  onCancel: () => void
  onCreateBinder: () => void
}

export default function AddToBinderDialog({
  isOpen,
  binders,
  currentBinderId,
  selectedCount,
  onConfirm,
  onCancel,
  onCreateBinder
}: AddToBinderDialogProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [selectedBinder, setSelectedBinder] = useState<string | null>(null)

  // Filter to custom binders only, excluding the current binder
  const availableBinders = binders.filter(
    (b) => !b.is_default && b.id !== currentBinderId
  )

  const handleConfirm = async () => {
    if (!selectedBinder) return
    setIsAdding(true)
    try {
      await onConfirm(selectedBinder)
    } finally {
      setIsAdding(false)
      setSelectedBinder(null)
    }
  }

  const handleCancel = () => {
    setSelectedBinder(null)
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
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
              <FolderPlus className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-grey-900">
                Add to Binder
              </h3>
              <p className="text-sm text-grey-500">
                {selectedCount} {selectedCount === 1 ? 'card' : 'cards'} selected
              </p>
            </div>
          </div>

          {/* Binder list */}
          {availableBinders.length > 0 ? (
            <div className="max-h-64 overflow-y-auto -mx-2">
              {availableBinders.map((binder) => (
                <button
                  key={binder.id}
                  onClick={() => setSelectedBinder(binder.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                    selectedBinder === binder.id
                      ? 'bg-orange-50 border border-orange-300'
                      : 'hover:bg-grey-50 border border-transparent'
                  }`}
                >
                  <span className="text-sm font-medium text-grey-900">
                    {binder.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-sm text-grey-500">
                No binders available. Create one to get started.
              </p>
            </div>
          )}

          {/* Create new binder option */}
          <button
            onClick={() => {
              handleCancel()
              onCreateBinder()
            }}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create New Binder
          </button>

          {/* Actions */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-grey-100">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isAdding}
              className="flex-1 px-4 py-2 border border-grey-300 text-grey-700 text-sm font-medium rounded-md hover:bg-grey-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isAdding || !selectedBinder}
              className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? 'Adding...' : 'Add to Binder'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
