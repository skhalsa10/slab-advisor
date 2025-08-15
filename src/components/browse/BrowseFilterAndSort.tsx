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
  rightContent
}: BrowseFilterAndSortProps) {
  // Show filter dropdown only if filter props are provided
  const showFilter = filterOptions && selectedFilterId !== undefined && onFilterChange

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <SearchBar 
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      <div className="flex gap-4">
        {showFilter && (
          <SortDropdown
            options={filterOptions}
            value={selectedFilterId}
            onChange={onFilterChange}
            className="sm:w-48"
          />
        )}
        <SortDropdown
          options={sortOptions}
          value={sortOrder}
          onChange={onSortChange}
          className="sm:w-48"
        />
        {rightContent}
      </div>
    </div>
  )
}