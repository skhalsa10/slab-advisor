'use client'

import { useState, useRef, useEffect } from 'react'

interface CreateBinderDialogProps {
  isOpen: boolean
  onConfirm: (name: string) => Promise<void>
  onCancel: () => void
}

export default function CreateBinderDialog({
  isOpen,
  onConfirm,
  onCancel
}: CreateBinderDialogProps) {
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setError(null)
      setIsCreating(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await onConfirm(name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create binder')
      setIsCreating(false)
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
        <div className="bg-card rounded-lg shadow-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Create New Binder
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="binder-name"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Binder Name
              </label>
              <input
                ref={inputRef}
                id="binder-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="e.g., Vintage Holos, Grading Queue"
                maxLength={100}
                disabled={isCreating}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isCreating}
                className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Binder'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
