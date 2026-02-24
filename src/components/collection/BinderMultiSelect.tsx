'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Lock, X, ChevronDown, Search, Plus, Loader2, Check } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { useBreakpoint } from '@/hooks/useIsDesktop'
import { createBinder } from '@/actions/binders'
import { trackBinderCreated } from '@/lib/posthog/events'
import type { Binder } from '@/types/database'

interface BinderMultiSelectProps {
  binders: Binder[]
  selectedBinderIds: string[]
  onSelectionChange: (binderIds: string[]) => void
  onBinderCreated?: (binder: Binder) => void
  disabled?: boolean
}

export default function BinderMultiSelect({
  binders: initialBinders,
  selectedBinderIds,
  onSelectionChange,
  onBinderCreated,
  disabled = false
}: BinderMultiSelectProps) {
  const breakpoints = useBreakpoint()
  const isTablet = breakpoints.md && !breakpoints.lg // 768-1023px — full-screen modal
  const useOverlay = !breakpoints.lg // phone + tablet use overlay instead of popover

  // Local copy of binders (initialized from prop, updated on inline creation)
  const [binderList, setBinderList] = useState<Binder[]>(() =>
    initialBinders.filter(b => !b.is_default)
  )
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  // Sync with prop changes (e.g. if parent re-fetches binders)
  useEffect(() => {
    setBinderList(initialBinders.filter(b => !b.is_default))
  }, [initialBinders])

  // Focus search input when popover/drawer opens
  useEffect(() => {
    if (open) {
      const ref = useOverlay ? mobileSearchInputRef : searchInputRef
      const timer = setTimeout(() => ref.current?.focus(), 50)
      return () => clearTimeout(timer)
    } else {
      setSearchTerm('')
      setCreateError(null)
    }
  }, [open, useOverlay])

  // Handle escape key for mobile drawer
  useEffect(() => {
    if (!open || !useOverlay) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, useOverlay])

  // Filter binders by search term
  const filteredBinders = useMemo(() => {
    if (!searchTerm.trim()) return binderList
    const term = searchTerm.toLowerCase()
    return binderList.filter(b => b.name.toLowerCase().includes(term))
  }, [binderList, searchTerm])

  // Check if search term exactly matches an existing binder (case-insensitive)
  const exactMatchExists = useMemo(() => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.trim().toLowerCase()
    return binderList.some(b => b.name.toLowerCase() === term)
  }, [binderList, searchTerm])

  // Selected binder objects for chip display
  const selectedBinders = useMemo(() =>
    binderList.filter(b => selectedBinderIds.includes(b.id)),
    [binderList, selectedBinderIds]
  )

  // Track how many chips overflow the single line
  const chipsContainerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(selectedBinders.length)

  const measureOverflow = useCallback(() => {
    const container = chipsContainerRef.current
    if (!container || selectedBinders.length === 0) {
      setVisibleCount(selectedBinders.length)
      return
    }
    // Container has overflow-hidden so all children are on one line.
    // Check which selected chips (index 1+) fit within the container width.
    const containerRight = container.getBoundingClientRect().right
    const children = Array.from(container.children) as HTMLElement[]
    let count = 0
    // Skip index 0 ("All Cards" chip), count selected chips that fit
    for (let i = 1; i < children.length; i++) {
      const childRight = children[i].getBoundingClientRect().right
      if (childRight <= containerRight + 1) { // +1px tolerance for subpixel rounding
        count++
      } else {
        break
      }
    }
    setVisibleCount(count)
  }, [selectedBinders.length])

  useEffect(() => {
    measureOverflow()
    window.addEventListener('resize', measureOverflow)
    return () => window.removeEventListener('resize', measureOverflow)
  }, [measureOverflow])

  const overflowCount = selectedBinders.length - visibleCount

  const handleToggle = (binderId: string) => {
    if (selectedBinderIds.includes(binderId)) {
      onSelectionChange(selectedBinderIds.filter(id => id !== binderId))
    } else {
      onSelectionChange([...selectedBinderIds, binderId])
    }
  }

  const handleRemoveChip = (binderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectionChange(selectedBinderIds.filter(id => id !== binderId))
  }

  const handleCreate = async () => {
    const name = searchTerm.trim()
    if (!name || isCreating) return

    setIsCreating(true)
    setCreateError(null)

    const result = await createBinder(name)

    if (result.error) {
      setCreateError(result.error)
      setIsCreating(false)
      return
    }

    if (result.data) {
      setBinderList(prev => [...prev, result.data!])
      onSelectionChange([...selectedBinderIds, result.data.id])
      onBinderCreated?.(result.data)
      trackBinderCreated({ source: 'add_to_collection_modal' })
      setSearchTerm('')
    }

    setIsCreating(false)
  }

  // --- Shared trigger element ---
  const triggerContent = (
    <>
      {/* Chips area — single line, overflow hidden for measurement */}
      <div ref={chipsContainerRef} className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
        {/* Locked "All Cards" chip */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-grey-100 text-grey-500 text-xs font-medium flex-shrink-0">
          <Lock className="w-3 h-3" />
          All Cards
        </span>

        {/* Selected binder chips */}
        {selectedBinders.map(binder => (
          <span
            key={binder.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-medium flex-shrink-0"
          >
            <span className="truncate max-w-[120px]">{binder.name}</span>
            <button
              type="button"
              onClick={(e) => handleRemoveChip(binder.id, e)}
              className="hover:bg-orange-100 rounded-full p-0.5 transition-colors"
              aria-label={`Remove ${binder.name}`}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {/* "+N more" badge when chips overflow */}
      {overflowCount > 0 && (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-grey-200 text-grey-600 text-xs font-medium flex-shrink-0">
          +{overflowCount}
        </span>
      )}

      {/* Placeholder when nothing selected */}
      {selectedBinders.length === 0 && (
        <span className="text-grey-400">Select binders...</span>
      )}

      <ChevronDown className={`w-4 h-4 text-grey-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
    </>
  )

  const triggerClasses = `w-full h-[38px] px-3 py-1.5 text-left border border-grey-300 rounded-md text-sm
    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
    transition-colors flex items-center gap-1.5
    ${disabled ? 'opacity-50 cursor-not-allowed bg-grey-50' : 'bg-white hover:border-grey-400 cursor-pointer'}`

  // --- Shared binder list content (search + list + create) ---
  const binderListContent = (inputRef: React.RefObject<HTMLInputElement | null>, listClassName: string, rowPadding = 'py-1.5') => (
    <>
      {/* Search input — pinned top */}
      <div className="flex-shrink-0 border-b border-grey-100 p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              if (createError) setCreateError(null)
            }}
            placeholder="Search binders..."
            aria-label="Search binders"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-grey-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Scrollable binder list */}
      <div className={listClassName}>
        {filteredBinders.length > 0 ? (
          <div className="p-1">
            {filteredBinders.map(binder => {
              const isSelected = selectedBinderIds.includes(binder.id)
              return (
                <button
                  key={binder.id}
                  type="button"
                  onClick={() => handleToggle(binder.id)}
                  className={`w-full flex items-center gap-2 px-2 ${rowPadding} rounded-md text-sm text-left cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-orange-50 text-orange-900'
                      : 'text-grey-700 hover:bg-grey-50'
                  }`}
                >
                  <span className={`flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                    isSelected
                      ? 'bg-orange-600 border-orange-600'
                      : 'border-grey-300'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="truncate">{binder.name}</span>
                </button>
              )
            })}
          </div>
        ) : searchTerm.trim() ? (
          <div className="p-3 text-center text-sm text-grey-500">
            No binders match &ldquo;{searchTerm}&rdquo;
          </div>
        ) : (
          <div className="p-3 text-center text-sm text-grey-500">
            No binders yet. Create one below.
          </div>
        )}
      </div>

      {/* Create new binder button — pinned bottom */}
      {!exactMatchExists && searchTerm.trim() && (
        <div className="flex-shrink-0 border-t border-grey-100 p-1">
          <button
            type="button"
            onClick={handleCreate}
            disabled={isCreating}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-orange-600 font-medium hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isCreating ? 'Creating...' : `Create "${searchTerm.trim()}"`}
          </button>
          {createError && (
            <p className="px-2 py-1 text-xs text-red-600">{createError}</p>
          )}
        </div>
      )}

      {/* Create prompt when no binders exist and no search */}
      {binderList.length === 0 && !searchTerm.trim() && (
        <div className="flex-shrink-0 border-t border-grey-100 p-2">
          <p className="text-xs text-grey-500 mb-1.5">Type a name above to create your first binder.</p>
        </div>
      )}
    </>
  )

  // --- PHONE + TABLET: Overlay layout ---
  if (useOverlay) {
    return (
      <div className="space-y-1.5">
        {/* Trigger */}
        <div
          role="combobox"
          tabIndex={disabled ? -1 : 0}
          aria-label="Select binders"
          aria-expanded={open}
          onClick={() => !disabled && setOpen(true)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              setOpen(true)
            }
          }}
          className={triggerClasses}
        >
          {triggerContent}
        </div>

        {/* Overlay */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] transition-opacity duration-300"
              onClick={() => setOpen(false)}
              aria-label="Close binder selector"
            />

            {isTablet ? (
              /* TABLET: Centered modal */
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Select binders"
                className="fixed z-[80] inset-0 bg-white flex flex-col"
              >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-grey-100">
                  <h3 className="text-base font-semibold text-grey-900">Select Binders</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors px-3 py-1 rounded-md hover:bg-orange-50"
                  >
                    Done
                  </button>
                </div>

                {/* Binder list content */}
                {binderListContent(mobileSearchInputRef, 'flex-1 min-h-0 overflow-y-auto')}
              </div>
            ) : (
              /* PHONE: Bottom sheet drawer */
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Select binders"
                className="fixed z-[80] bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col h-[60vh] transform transition-transform duration-300 ease-out translate-y-0"
              >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-grey-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-grey-100">
                  <h3 className="text-base font-semibold text-grey-900">Select Binders</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors px-3 py-1 rounded-md hover:bg-orange-50"
                  >
                    Done
                  </button>
                </div>

                {/* Binder list content */}
                {binderListContent(mobileSearchInputRef, 'flex-1 min-h-0 overflow-y-auto', 'py-3')}

                {/* Safe area padding for devices with home indicator */}
                <div className="flex-shrink-0 h-safe-area-inset-bottom pb-2" />
              </div>
            )}
          </>
        )}

        {/* Static "All Cards" info */}
        <p className="text-xs text-grey-400">
          Cards are automatically added to All Cards.
        </p>
      </div>
    )
  }

  // --- DESKTOP: Popover layout ---
  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <div
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-label="Select binders"
            aria-expanded={open}
            className={triggerClasses}
          >
            {triggerContent}
          </div>
        </PopoverTrigger>

        <PopoverContent align="start" sideOffset={4} className="flex flex-col">
          {binderListContent(searchInputRef, 'max-h-40 overflow-y-auto')}
        </PopoverContent>
      </Popover>

      {/* Static "All Cards" info */}
      <p className="text-xs text-grey-400">
        Cards are automatically added to All Cards.
      </p>
    </div>
  )
}
