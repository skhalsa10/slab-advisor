'use client'

import { useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import ViewToggle, { type ViewMode } from '@/components/ui/ViewToggle'
import BrowseFilterAndSort from '@/components/browse/BrowseFilterAndSort'
import { useURLFilters } from '@/hooks/useURLFilters'
import {
  BROWSE_PARAM_SERIES,
  BROWSE_PARAM_SEARCH,
  BROWSE_PARAM_SORT,
  BROWSE_PARAM_VIEW,
  BROWSE_DEFAULTS,
} from '@/constants/url-filters'
import SetCard from '@/components/pokemon/SetCard'
import SetListItem from '@/components/pokemon/SetListItem'
import NoResultsMessage from '@/components/pokemon/NoResultsMessage'
import type { PokemonSetWithSeries } from '@/models/pokemon'

interface PokemonBrowseClientProps {
  initialSets: PokemonSetWithSeries[]
  seriesOptions: Array<{
    id: string
    name: string
  }>
}

export default function PokemonBrowseClient({ initialSets, seriesOptions }: PokemonBrowseClientProps) {
  // Use URL-synced filters for state persistence across navigation
  const { values, setters } = useURLFilters('/browse/pokemon', {
    series: { key: BROWSE_PARAM_SERIES, defaultValue: BROWSE_DEFAULTS.series },
    search: { key: BROWSE_PARAM_SEARCH, defaultValue: BROWSE_DEFAULTS.search },
    sort: { key: BROWSE_PARAM_SORT, defaultValue: BROWSE_DEFAULTS.sort },
    view: { key: BROWSE_PARAM_VIEW, defaultValue: BROWSE_DEFAULTS.view }
  })

  // Destructure for easier access
  const selectedSeriesId = values.series
  const setSearchQuery = values.search
  const sortOrder = values.sort
  const viewMode = values.view as ViewMode

  // Create dropdown options from server-provided series data
  const seriesDropdownOptions = useMemo(() => [
    { value: '', label: 'All Series' },
    ...seriesOptions.map(series => ({ value: series.id, label: series.name }))
  ], [seriesOptions])

  // Filter and sort sets using initial data
  const filteredSets = useMemo(() => {
    let result = initialSets

    // Filter by selected series
    if (selectedSeriesId) {
      result = result.filter(set => set.series.id === selectedSeriesId)
    }

    // Filter by set name
    if (setSearchQuery) {
      result = result.filter(set => 
        set.name.toLowerCase().includes(setSearchQuery.toLowerCase())
      )
    }

    // Sort sets
    result = [...result].sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

    return result
  }, [initialSets, selectedSeriesId, setSearchQuery, sortOrder])

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pokemon Trading Cards"
        description="Browse all Pokemon TCG series and sets"
      />

      {/* Search and Sort Controls */}
      <BrowseFilterAndSort
        searchQuery={setSearchQuery}
        onSearchChange={setters.search}
        searchPlaceholder="Search by set name..."
        selectedFilterId={selectedSeriesId}
        onFilterChange={setters.series}
        filterOptions={seriesDropdownOptions}
        sortOrder={sortOrder}
        onSortChange={setters.sort}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' }
        ]}
        rightContent={
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={(v) => setters.view(v)}
          />
        }
      />

      {/* Sets Display - Grid or List based on viewMode */}
      {viewMode === 'grid' ? (
        <ItemGrid
          items={filteredSets}
          renderItem={(set) => (
            <SetCard 
              key={set.id} 
              set={set} 
              series={set.series}
            />
          )}
          emptyStateComponent={
            <NoResultsMessage 
              seriesSearchQuery={selectedSeriesId ? seriesOptions.find(s => s.id === selectedSeriesId)?.name || '' : ''}
              setSearchQuery={setSearchQuery}
            />
          }
          columns={{
            base: 1,
            'min-480': 2,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 5
          }}
          gap={4}
        />
      ) : (
        <ItemList
          items={filteredSets}
          renderHeader={() => (
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Set
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Series
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Cards
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                Release Date
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          )}
          renderRow={(set) => (
            <SetListItem
              key={set.id}
              set={set}
              series={set.series}
            />
          )}
          emptyStateComponent={
            <NoResultsMessage 
              seriesSearchQuery={selectedSeriesId ? seriesOptions.find(s => s.id === selectedSeriesId)?.name || '' : ''}
              setSearchQuery={setSearchQuery}
            />
          }
        />
      )}
    </div>
  )
}