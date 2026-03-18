'use client'

import { useState, useRef, useEffect } from 'react'

interface RenameBinderDialogProps {
  isOpen: boolean
  currentName: string
  onConfirm: (name: string) => Promise<void>
  onCancel: () => void
}

export default function RenameBinderDialog({
  isOpen,
  currentName,
  onConfirm,
  onCancel
}: RenameBinderDialogProps) {
  const [name, setName] = useState(currentName)
  const [isRenaming, setIsRenaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus and select input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(currentName)
      const timer = setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentName])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setIsRenaming(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (name.trim() === currentName) {
      onCancel()
      return
    }

    setIsRenaming(true)
    setError(null)

    try {
      await onConfirm(name.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename binder')
      setIsRenaming(false)
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
            Rename Binder
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="binder-rename"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Binder Name
              </label>
              <input
                ref={inputRef}
                id="binder-rename"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                maxLength={100}
                disabled={isRenaming}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={isRenaming}
                className="flex-1 px-4 py-2 border border-border text-foreground text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRenaming || !name.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRenaming ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
