'use client'

import { useState, useEffect } from 'react'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  showHints?: boolean
  onFocusChange?: (isFocused: boolean) => void
  onCameraClick?: () => void
  showCameraIcon?: boolean
}

/**
 * SearchBar Component
 *
 * Reusable search input with intelligent search hints and examples.
 * Supports structured queries and provides helpful formatting tips.
 *
 * @param placeholder - Custom placeholder text
 * @param value - Current search value
 * @param onChange - Callback when search value changes
 * @param className - Additional CSS classes
 * @param showHints - Whether to show search hints below input
 * @param onFocusChange - Callback when focus state changes
 * @param onCameraClick - Callback when camera icon is clicked
 * @param showCameraIcon - Whether to show camera icon in the search bar
 */
export default function SearchBar({
  placeholder = 'Search cards...',
  value,
  onChange,
  className = '',
  showHints = true,
  onFocusChange,
  onCameraClick,
  showCameraIcon = false
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  // Notify parent of focus changes
  useEffect(() => {
    onFocusChange?.(isFocused)
  }, [isFocused, onFocusChange])

  const defaultPlaceholder = 'Try: pikachu 181, #025, name:"charizard" set:"base set"'

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Could add keyboard shortcuts here in the future
    // e.g., Escape to clear, Enter to select first result
    if (e.key === 'Escape') {
      onChange('')
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg 
            className="h-5 w-5 text-grey-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          className={`block w-full pl-10 py-3 border border-grey-300 rounded-lg
                     placeholder-grey-500 focus:outline-none focus:ring-2
                     focus:ring-orange-500 focus:border-orange-500
                     text-sm transition-colors
                     ${value ? 'pr-10' : showCameraIcon && isFocused ? 'pr-12' : 'pr-3'}`}
        />

        {/* Right side buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
          {/* Clear button - show when there's a value */}
          {value && (
            <button
              onClick={() => onChange('')}
              className="text-grey-400 hover:text-grey-600 transition-colors"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Camera icon - show when focused, no value, and camera is enabled */}
          {showCameraIcon && isFocused && !value && onCameraClick && (
            <button
              onClick={onCameraClick}
              onMouseDown={(e) => e.preventDefault()} // Prevent blur
              className="text-grey-400 hover:text-orange-500 transition-colors p-1"
              type="button"
              aria-label="Scan with camera"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search Hints - only show when input is focused */}
      {showHints && isFocused && (
        <div className="mt-2 p-3 bg-grey-50 rounded-lg border border-grey-200">
          <h4 className="text-xs font-medium text-grey-700 mb-2">Search Tips:</h4>
          <div className="space-y-1 text-xs text-grey-600">
            <div className="flex items-center space-x-2">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border">pikachu 181</span>
              <span>Name and number</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border">#025</span>
              <span>Exact card number</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border">stellar crown charizard</span>
              <span>Set and card name</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border">name:&quot;pikachu&quot; id:&quot;181&quot; set:&quot;base set&quot;</span>
              <span>Precise search (any combination)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}