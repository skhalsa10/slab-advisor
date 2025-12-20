'use client'

import { useState, useRef, useEffect } from 'react'

interface SortOption {
  value: string
  label: string
}

interface SortDropdownProps {
  options: SortOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  title?: string
}

export default function SortDropdown({ options, value, onChange, className = '', title = 'Sort by' }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  // Close dropdown when clicking outside (only for desktop dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-grey-100 text-grey-600 hover:text-grey-900 hover:bg-grey-200 transition-colors"
        aria-label={`Sort by: ${selectedOption?.label || 'Select'}`}
        title={`Sort: ${selectedOption?.label || 'Select'}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* Sort arrows icon */}
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </button>

      {/* Desktop/Tablet: Dropdown menu */}
      {isOpen && (
        <div
          className="hidden sm:block absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-grey-200 py-1 z-50"
          role="listbox"
          aria-label="Sort options"
        >
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                option.value === value
                  ? 'bg-orange-50 text-orange-600 font-medium'
                  : 'text-grey-700 hover:bg-grey-50'
              }`}
              role="option"
              aria-selected={option.value === value}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Mobile: Bottom sheet */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="sm:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div
            className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slide-up"
            role="listbox"
            aria-label="Sort options"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-grey-300 rounded-full" />
            </div>

            {/* Title */}
            <div className="px-4 pb-2 border-b border-grey-100">
              <h3 className="text-lg font-semibold text-grey-900">{title}</h3>
            </div>

            {/* Options */}
            <div className="py-2 max-h-[60vh] overflow-y-auto">
              {options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-3 text-base transition-colors flex items-center justify-between ${
                    option.value === value
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-grey-700 active:bg-grey-50'
                  }`}
                  role="option"
                  aria-selected={option.value === value}
                >
                  <span className={option.value === value ? 'font-medium' : ''}>
                    {option.label}
                  </span>
                  {option.value === value && (
                    <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {/* Safe area padding for devices with home indicator */}
            <div className="h-safe-area-inset-bottom pb-6" />
          </div>
        </>
      )}
    </div>
  )
}