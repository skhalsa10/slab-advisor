'use client'

import { useState, useMemo } from 'react'
import PageHeader from '@/components/ui/PageHeader'
import SearchBar from '@/components/ui/SearchBar'
import SortDropdown from '@/components/ui/SortDropdown'
import SetCard from '@/components/pokemon/SetCard'
import NoResultsMessage from '@/components/pokemon/NoResultsMessage'
import type { PokemonSetWithSeries } from '@/models/pokemon'

interface PokemonBrowseClientProps {
  initialSets: PokemonSetWithSeries[]
}

export default function PokemonBrowseClient({ initialSets }: PokemonBrowseClientProps) {
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('')
  const [setSearchQuery, setSetSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  // Filter and sort sets using initial data
  const filteredSets = useMemo(() => {
    let result = initialSets

    // Filter by series name
    if (seriesSearchQuery) {
      result = result.filter(set => 
        set.series.name.toLowerCase().includes(seriesSearchQuery.toLowerCase())
      )
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
  }, [initialSets, seriesSearchQuery, setSearchQuery, sortOrder])

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Pokemon Trading Cards"
        description="Browse all Pokemon TCG series and sets"
      />

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SearchBar 
            placeholder="Search by series name..."
            value={seriesSearchQuery}
            onChange={setSeriesSearchQuery}
          />
          <SearchBar 
            placeholder="Search by set name..."
            value={setSearchQuery}
            onChange={setSetSearchQuery}
          />
        </div>
        <SortDropdown
          options={[
            { value: 'newest', label: 'Newest First' },
            { value: 'oldest', label: 'Oldest First' }
          ]}
          value={sortOrder}
          onChange={setSortOrder}
          className="sm:w-48"
        />
      </div>

      {/* Sets Grid */}
      <div>
        {filteredSets.length === 0 ? (
          <NoResultsMessage 
            seriesSearchQuery={seriesSearchQuery}
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