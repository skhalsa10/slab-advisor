'use client'

import { useState, useEffect, useMemo } from 'react'
import { getAllSeriesWithSets } from '@/lib/pokemon-db'
import AppNavigation from '@/components/layout/AppNavigation'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PageHeader from '@/components/ui/PageHeader'
import SearchBar from '@/components/ui/SearchBar'
import SortDropdown from '@/components/ui/SortDropdown'
import ErrorState from '@/components/ui/ErrorState'
import SetCard from '@/components/pokemon/SetCard'
import NoResultsMessage from '@/components/pokemon/NoResultsMessage'
import type { SerieWithSets, PokemonSet, PokemonSeries } from '@/models/pokemon'

export default function PokemonBrowsePage() {
  const [series, setSeries] = useState<SerieWithSets[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('')
  const [setSearchQuery, setSetSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const data = await getAllSeriesWithSets()
        setSeries(data)
        setError(null)
      } catch (err) {
        setError('Failed to load Pokemon series. Please try again later.')
        console.error('Error fetching series:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Flatten series and sets, then filter and sort
  const filteredSets = useMemo(() => {
    // Flatten all sets with their series information
    const allSets: (PokemonSet & { series: PokemonSeries })[] = []
    
    series.forEach(serie => {
      serie.sets.forEach(set => {
        allSets.push({
          ...set,
          series: serie
        })
      })
    })

    let result = allSets

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
  }, [series, seriesSearchQuery, setSearchQuery, sortOrder])

  if (loading) {
    return (
      <AppNavigation>
        <LoadingScreen fullScreen={false} />
      </AppNavigation>
    )
  }

  if (error) {
    return (
      <AppNavigation>
        <ErrorState 
          message={error}
          onRetry={() => window.location.reload()}
        />
      </AppNavigation>
    )
  }

  return (
    <AppNavigation>
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
    </AppNavigation>
  )
}