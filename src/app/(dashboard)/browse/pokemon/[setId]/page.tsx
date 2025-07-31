'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSetWithCards, getCardImageUrl, getLogoUrl } from '@/lib/pokemon-db'
import type { SetWithCards } from '@/models/pokemon'
import CardDetailsModal from '@/components/browse/CardDetailsModal'

export default function SetDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const setId = params.setId as string
  
  const [set, setSet] = useState<SetWithCards | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchSet() {
      try {
        setLoading(true)
        const data = await getSetWithCards(setId)
        setSet(data)
        setError(null)
      } catch (err) {
        setError('Failed to load set details. Please try again later.')
        console.error('Error fetching set:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSet()
  }, [setId])

  // Filter cards based on search query
  const filteredCards = useMemo(() => {
    if (!set || !searchQuery) return set?.cards || []
    
    return set.cards.filter(card => 
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.local_id && card.local_id.toString().toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [set, searchQuery])

  const handleCardClick = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    setSelectedCardId(cardId)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-grey-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-grey-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="aspect-[2.5/3.5] bg-grey-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !set) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-grey-900 mb-2">Error Loading Set</h3>
        <p className="text-sm text-grey-600 mb-4">{error || 'Set not found'}</p>
        <button
          onClick={() => router.push('/browse/pokemon')}
          className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
        >
          Back to Sets
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-grey-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {set.logo && (
              <Image
                src={getLogoUrl(set.logo)}
                alt={set.name}
                width={80}
                height={80}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-grey-900">{set.name}</h1>
              <p className="mt-1 text-sm text-grey-600">
                {set.series?.name} • {set.card_count_total || 0} cards
              </p>
              {set.release_date && (
                <p className="mt-1 text-sm text-grey-500">
                  Released: {new Date(set.release_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <Link
            href="/browse/pokemon"
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            ← Back to Sets
          </Link>
        </div>

        {/* Set Statistics */}
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">Total Cards</p>
              <p className="text-lg font-semibold text-grey-900">{set.card_count_total || 0}</p>
            </div>
            <div className="bg-grey-50 rounded-lg p-3">
              <p className="text-xs text-grey-600">Official Count</p>
              <p className="text-lg font-semibold text-grey-900">{set.card_count_official || 0}</p>
            </div>
            {(set.card_count_holo ?? 0) > 0 && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-xs text-grey-600">Holo Cards</p>
                <p className="text-lg font-semibold text-grey-900">{set.card_count_holo}</p>
              </div>
            )}
            {(set.card_count_reverse ?? 0) > 0 && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-xs text-grey-600">Reverse Holo</p>
                <p className="text-lg font-semibold text-grey-900">{set.card_count_reverse}</p>
              </div>
            )}
            {(set.card_count_first_ed ?? 0) > 0 && (
              <div className="bg-grey-50 rounded-lg p-3">
                <p className="text-xs text-grey-600">1st Edition</p>
                <p className="text-lg font-semibold text-grey-900">{set.card_count_first_ed}</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by card name or number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredCards.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-grey-600">No cards found matching &quot;{searchQuery}&quot;</p>
          </div>
        ) : (
          filteredCards.map((card) => (
            <Link
              key={card.id}
              href={`/browse/pokemon/${setId}/${card.id}`}
              onClick={(e) => handleCardClick(e, card.id)}
              className="group relative bg-white rounded-lg overflow-hidden border border-grey-200 hover:border-orange-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="aspect-[2.5/3.5] relative">
                <Image
                  src={getCardImageUrl(card.image, 'low')}
                  alt={card.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  onError={(e) => {
                    e.currentTarget.src = '/card-placeholder.svg'
                  }}
                />
              </div>
              <div className="p-2">
                <h3 className="text-xs font-medium text-grey-900 truncate">
                  {card.name}
                </h3>
                <p className="text-xs text-grey-600">
                  #{card.local_id}
                  {card.rarity && ` • ${card.rarity}`}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Card Details Modal */}
      {selectedCardId && (
        <CardDetailsModal
          cardId={selectedCardId}
          setId={setId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCardId(null)
          }}
        />
      )}
    </div>
  )
}