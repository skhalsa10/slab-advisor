'use client'

import { useState } from 'react'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  showHints?: boolean
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
 */
export default function SearchBar({
  placeholder = 'Search cards...',
  value,
  onChange,
  className = '',
  showHints = true
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

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
          className="block w-full pl-10 pr-3 py-3 border border-grey-300 rounded-lg 
                     placeholder-grey-500 focus:outline-none focus:ring-2 
                     focus:ring-orange-500 focus:border-orange-500 
                     text-sm transition-colors"
        />
        
        {/* Clear button */}
        {value && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              onClick={() => onChange('')}
              className="text-grey-400 hover:text-grey-600 transition-colors"
              type="button"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Search Hints */}
      {showHints && (isFocused || value.length === 0) && (
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
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border">name:&quot;pikachu&quot; id:&quot;181&quot;</span>
              <span>Precise search</span>
            </div>
          </div>
          
          {/* Advanced search hint */}
          <div className="mt-3 pt-2 border-t border-grey-300">
            <p className="text-xs text-grey-500">
              💡 <strong>Pro tip:</strong> Use quotes for exact matches, combine name + number for best results
            </p>
          </div>
        </div>
      )}
    </div>
  )
}