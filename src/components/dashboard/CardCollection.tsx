'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

interface Card {
  id: string
  user_id: string
  front_image_url: string | null
  back_image_url: string | null
  card_title: string | null
  estimated_grade: number | null
  confidence: number | null
  created_at: string
  updated_at: string
}

interface CardCollectionProps {
  onViewCard: (cardId: string) => void
  onUploadNew: () => void
}

export default function CardCollection({ onViewCard, onUploadNew }: CardCollectionProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        console.error('Error loading cards:', cardsError)
        setError('Failed to load your cards')
      } else {
        setCards(cardsData || [])
      }
    } catch (err) {
      console.error('Error in loadUserCards:', err)
      setError('Failed to load your cards')
    } finally {
      setLoading(false)
    }
  }

  const formatGrade = (grade: number | null): string => {
    if (grade === null) return 'Not graded'
    return `${grade}/10`
  }

  const formatConfidence = (confidence: number | null): string => {
    if (confidence === null) return 'N/A'
    return `${Math.round(confidence * 100)}%`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
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
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-grey-900">No cards yet</h3>
        <p className="mt-1 text-sm text-grey-500">Get started by uploading your first card for analysis.</p>
        <div className="mt-6">
          <button
            onClick={onUploadNew}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Upload First Card
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-grey-900">Your Card Collection</h2>
        <button
          onClick={onUploadNew}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Upload New Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div key={card.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-w-3 aspect-h-4 bg-grey-200">
              {card.front_image_url ? (
                <img
                  src={card.front_image_url}
                  alt={card.card_title || 'Trading card'}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-grey-100">
                  <svg className="h-12 w-12 text-grey-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-medium text-grey-900 truncate">
                  {card.card_title || 'Untitled Card'}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  card.estimated_grade 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-grey-100 text-grey-800'
                }`}>
                  {formatGrade(card.estimated_grade)}
                </span>
              </div>
              
              <div className="text-xs text-grey-500 space-y-1">
                <div>Confidence: {formatConfidence(card.confidence)}</div>
                <div>Analyzed: {formatDate(card.created_at)}</div>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => onViewCard(card.id)}
                  className="w-full text-center px-3 py-2 border border-orange-300 text-orange-700 text-sm font-medium rounded-md hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}