'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import BrowseFilterAndSort from '@/components/browse/BrowseFilterAndSort'
import SetCard from '@/components/pokemon/SetCard'
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
      />

      {/* Sets Grid */}
      <div>
        {filteredSets.length === 0 ? (
          <NoResultsMessage 
            seriesSearchQuery={selectedSeriesId ? seriesOptions.find(s => s.id === selectedSeriesId)?.name || '' : ''}
            setSearchQuery={setSearchQuery}
          />
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredSets.map((set) => (
              <SetCard 
                key={set.id} 
                set={set} 
                series={set.series}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}