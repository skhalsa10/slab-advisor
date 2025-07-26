'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Card } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import CollectionHeader from '@/components/collection/CollectionHeader'
import CardGridView from '@/components/collection/CardGridView'
import CardListView from '@/components/collection/CardListView'
import EmptyCollectionState from '@/components/collection/EmptyCollectionState'
import { type ViewMode } from '@/components/collection/ViewToggle'

export default function CollectionPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const router = useRouter()

  useEffect(() => {
    loadUserCards()
  }, [])

  const loadUserCards = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setError('User not authenticated')
        setLoading(false)
        return
      }

      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (cardsError) {
        setError('Failed to load your cards')
      } else {
        setCards(cardsData || [])
      }
    } catch {
      setError('Failed to load your cards')
    } finally {
      setLoading(false)
    }
  }

  const handleViewCard = (cardId: string) => {
    // For now, we'll navigate to the details view
    // In the future, this could be a modal or a separate details page
    router.push(`/collection/${cardId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadUserCards}
          className="text-orange-600 hover:text-orange-500"
        >
          Try again
        </button>
      </div>
    )
  }

  if (cards.length === 0) {
    return <EmptyCollectionState />
  }

  return (
    <div className={viewMode === 'list' ? 'h-[calc(100vh-1.5rem)] flex flex-col overflow-hidden' : ''}>
      <CollectionHeader 
        cardCount={cards.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {viewMode === 'grid' ? (
        <CardGridView cards={cards} onViewCard={handleViewCard} />
      ) : (
        <div className="flex-1 min-h-0">
          <CardListView cards={cards} onViewCard={handleViewCard} />
        </div>
      )}
    </div>
  )
}