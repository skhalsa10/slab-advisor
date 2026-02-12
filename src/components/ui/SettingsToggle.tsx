'use client'

import { useState } from 'react'

interface SettingsToggleProps {
  id: string
  label: string
  description?: string
  initialValue: boolean
  onToggle: (value: boolean) => Promise<void>
}

export default function SettingsToggle({
  id,
  label,
  description,
  initialValue,
  onToggle,
}: SettingsToggleProps) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    const newValue = !enabled
    const previousValue = enabled

    // Optimistic update - change UI immediately
    setEnabled(newValue)
    setIsLoading(true)

    try {
      await onToggle(newValue)
    } catch (error) {
      // Revert on failure
      setEnabled(previousValue)
      console.error('Failed to update setting:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-grey-900">
          {label}
        </label>
        {description && (
          <p className="text-sm text-grey-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={isLoading}
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
          border-2 border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${enabled ? 'bg-orange-500' : 'bg-grey-200'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full
            bg-white shadow ring-0 transition duration-200 ease-in-out
            ${enabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  )
}
