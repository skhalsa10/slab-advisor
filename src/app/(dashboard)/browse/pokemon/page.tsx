'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getAllSeriesWithSets, getLogoUrl } from '@/lib/pokemon-db'
import type { SerieWithSets } from '@/models/pokemon'

export default function PokemonBrowsePage() {
  const [series, setSeries] = useState<SerieWithSets[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seriesSearchQuery, setSeriesSearchQuery] = useState('')
  const [setSearchQuery, setSetSearchQuery] = useState('')

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

  // Filter series and sets based on search queries
  const filteredSeries = useMemo(() => {
    let result = series

    // Filter by series name
    if (seriesSearchQuery) {
      result = result.filter(serie => 
        serie.name.toLowerCase().includes(seriesSearchQuery.toLowerCase())
      )
    }

    // Filter by set name
    if (setSearchQuery) {
      result = result.map(serie => ({
        ...serie,
        sets: serie.sets.filter(set => 
          set.name.toLowerCase().includes(setSearchQuery.toLowerCase())
        )
      })).filter(serie => serie.sets.length > 0)
    }

    return result
  }, [series, seriesSearchQuery, setSearchQuery])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-grey-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-grey-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-grey-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-grey-900 mb-2">Error Loading Data</h3>
        <p className="text-sm text-grey-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grey-900">Pokemon Trading Cards</h1>
        <p className="mt-1 text-sm text-grey-600">
          Browse all Pokemon TCG series and sets
        </p>
      </div>

      {/* Search Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by series name..."
            value={seriesSearchQuery}
            onChange={(e) => setSeriesSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-grey-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by set name..."
            value={setSearchQuery}
            onChange={(e) => setSetSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-grey-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-grey-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Series and Sets */}
      <div className="space-y-8">
        {filteredSeries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-grey-600">
              {seriesSearchQuery || setSearchQuery 
                ? `No results found${seriesSearchQuery ? ` for series "${seriesSearchQuery}"` : ''}${seriesSearchQuery && setSearchQuery ? ' and' : ''}${setSearchQuery ? ` for sets "${setSearchQuery}"` : ''}`
                : 'No series or sets found'
              }
            </p>
          </div>
        ) : (
          filteredSeries.map((serie) => (
            <div key={serie.id} className="space-y-4">
              <div className="flex items-center space-x-3">
                {serie.logo && (
                  <Image
                    src={getLogoUrl(serie.logo)}
                    alt={serie.name}
                    width={40}
                    height={40}
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <h2 className="text-xl font-semibold text-grey-900">{serie.name}</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {serie.sets.map((set) => (
                  <Link
                    key={set.id}
                    href={`/browse/pokemon/${set.id}`}
                    className="group bg-white border border-grey-200 rounded-lg hover:border-orange-300 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="aspect-square p-6 flex flex-col items-center justify-center">
                      {set.logo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                          <div className="flex-1 flex items-center justify-center w-full">
                            <Image
                              src={getLogoUrl(set.logo)}
                              alt={set.name}
                              width={140}
                              height={140}
                              className="object-contain max-h-full group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <h3 className="font-medium text-grey-900 text-sm">
                              {set.name}
                            </h3>
                            <p className="text-sm text-grey-600 mt-1">
                              {set.card_count_total || 0} cards
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <h3 className="font-bold text-grey-900 text-xl mb-2">
                            {set.name}
                          </h3>
                          <p className="text-sm text-grey-600">
                            {set.card_count_total || 0} cards
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}