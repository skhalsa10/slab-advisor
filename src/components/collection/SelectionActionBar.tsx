'use client'

import { FolderPlus, FolderMinus, Trash2 } from 'lucide-react'
import { type CollectionType } from '@/components/collection/CollectionHeader'

interface SelectionActionBarProps {
  selectedCount: number
  isCustomBinder: boolean
  collectionType: CollectionType
  onAddToBinder: () => void
  onRemoveFromBinder: () => void
  onDelete: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  isAllSelected: boolean
}

export default function SelectionActionBar({
  selectedCount,
  isCustomBinder,
  collectionType,
  onAddToBinder,
  onRemoveFromBinder,
  onDelete,
  onSelectAll,
  onDeselectAll,
  isAllSelected
}: SelectionActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={[
        'fixed z-40 animate-slide-up',
        // Mobile: full-width bottom dock
        'bottom-0 left-0 right-0 w-full',
        // Desktop: floating centered island
        'md:bottom-8 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-auto'
      ].join(' ')}
    >
      {/* Mobile: stacked two-row layout / Desktop: single-row pill */}
      <div
        className={[
          'bg-white shadow-xl',
          // Mobile: dock shape
          'border-t border-grey-200 rounded-t-xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]',
          // Desktop: pill shape, single row
          'md:flex md:items-center md:border md:rounded-full md:px-5 md:py-3 md:pb-3 md:gap-3'
        ].join(' ')}
      >
        {/* Row 1 on mobile: count + select all */}
        <div className="flex items-center justify-between mb-3 md:mb-0 md:gap-2 md:flex-shrink-0">
          <span className="text-sm font-semibold text-grey-900 whitespace-nowrap">
            {selectedCount} selected
          </span>
          <button
            onClick={isAllSelected ? onDeselectAll : onSelectAll}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap transition-colors"
          >
            {isAllSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Divider — desktop only */}
        <div className="hidden md:block w-px h-6 bg-grey-200 flex-shrink-0" />

        {/* Row 2 on mobile: action buttons / Desktop: inline buttons */}
        <div className="flex items-center gap-2">
          {/* Add to Binder — only for cards */}
          {collectionType === 'cards' && (
            <button
              onClick={onAddToBinder}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-full transition-colors whitespace-nowrap"
            >
              <FolderPlus className="w-4 h-4 flex-shrink-0" />
              Add<span className="hidden sm:inline">&nbsp;to Binder</span>
            </button>
          )}

          {/* Remove from Binder — only when viewing a custom binder, cards only */}
          {collectionType === 'cards' && isCustomBinder && (
            <button
              onClick={onRemoveFromBinder}
              className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 text-sm font-medium text-grey-700 border border-grey-300 hover:bg-grey-50 rounded-full transition-colors whitespace-nowrap"
            >
              <FolderMinus className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Remove</span>
              <span className="sm:hidden">Remove</span>
            </button>
          )}

          {/* Delete */}
          <button
            onClick={onDelete}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 md:py-1.5 text-sm font-medium text-red-600 border border-grey-300 hover:bg-red-50 hover:border-red-300 rounded-full transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
