import SearchBar from '@/components/ui/SearchBar'
import SortDropdown from '@/components/ui/SortDropdown'

interface BrowseFilterAndSortProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  
  selectedFilterId: string
  onFilterChange: (id: string) => void
  filterOptions: Array<{ value: string; label: string }>
  
  sortOrder: string
  onSortChange: (order: string) => void
  sortOptions: Array<{ value: string; label: string }>
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
  sortOptions
}: BrowseFilterAndSortProps) {
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
        <SortDropdown
          options={filterOptions}
          value={selectedFilterId}
          onChange={onFilterChange}
          className="sm:w-48"
        />
        <SortDropdown
          options={sortOptions}
          value={sortOrder}
          onChange={onSortChange}
          className="sm:w-48"
        />
      </div>
    </div>
  )
}