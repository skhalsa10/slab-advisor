'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import ItemGrid from '@/components/ui/ItemGrid'
import ItemList from '@/components/ui/ItemList'
import ViewToggle, { type ViewMode } from '@/components/ui/ViewToggle'
import BrowseFilterAndSort from '@/components/browse/BrowseFilterAndSort'
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
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [setSearchQuery, setSetSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

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
        onSearchChange={setSetSearchQuery}
        searchPlaceholder="Search by set name..."
        selectedFilterId={selectedSeriesId}
        onFilterChange={setSelectedSeriesId}
        filterOptions={seriesDropdownOptions}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        sortOptions={[
          { value: 'newest', label: 'Newest First' },
          { value: 'oldest', label: 'Oldest First' }
        ]}
        rightContent={
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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