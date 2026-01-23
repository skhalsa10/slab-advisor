import { ReactNode } from 'react'
import SearchBar from '@/components/ui/SearchBar'
import SortDropdown from '@/components/ui/SortDropdown'

interface BrowseFilterAndSortProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string

  selectedFilterId?: string
  onFilterChange?: (id: string) => void
  filterOptions?: Array<{ value: string; label: string }>

  sortOrder: string
  onSortChange: (order: string) => void
  sortOptions: Array<{ value: string; label: string }>

  /** Content to display between search and sort controls (e.g., segmented filter) */
  middleContent?: ReactNode
  rightContent?: ReactNode
}

export default function BrowseFilterAndSort({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  selectedFilterId,
  onFilterChange,
  filterOptions,
  sortOrder,
  onSortChange,
  sortOptions,
  middleContent,
  rightContent
}: BrowseFilterAndSortProps) {
  // Show filter dropdown only if filter props are provided
  const showFilter = filterOptions && selectedFilterId !== undefined && onFilterChange

  return (
    <div className="flex items-center gap-3">
      {/* Search bar: full width on mobile/tablet, capped width on desktop */}
      <div className="flex-1 xl:flex-none xl:w-96">
        <SearchBar
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      {/* Spacer to push controls to the right on desktop */}
      <div className="hidden xl:block xl:flex-1" />
      <div className="flex items-center gap-2">
        {middleContent}
        {showFilter && (
          <SortDropdown
            options={filterOptions}
            value={selectedFilterId}
            onChange={onFilterChange}
            icon="filter"
            title="Filter by"
          />
        )}
        <SortDropdown
          options={sortOptions}
          value={sortOrder}
          onChange={onSortChange}
        />
        {rightContent}
      </div>
    </div>
  )
}