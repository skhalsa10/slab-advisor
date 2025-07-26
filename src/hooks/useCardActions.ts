import { useState, useCallback } from 'react'
import { supabase, type Card } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'

export interface UseCardActionsReturn {
  card: Card | null
  loading: boolean
  error: string
  deleting: boolean
  loadCard: () => Promise<void>
  deleteCard: () => Promise<boolean>
  refreshCard: () => Promise<void>
}

export function useCardActions(cardId: string): UseCardActionsReturn {
  const [card, setCard] = useState<Card | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadCard = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user.id) // Ensure user owns this card
        .single()

      if (cardError) {
        setError('Card not found')
      } else {
        setCard(cardData)
        setError('')
      }
    } catch {
      setError('Failed to load card details')
    } finally {
      setLoading(false)
    }
  }, [cardId])

  const deleteCard = useCallback(async (): Promise<boolean> => {
    if (!card) return false

    setDeleting(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        setError('User not authenticated')
        return false
      }

      const { error: deleteError } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id)
        .eq('user_id', user.id) // Ensure user owns this card

      if (deleteError) {
        setError('Failed to delete card')
        return false
      }

      return true
    } catch {
      setError('Failed to delete card')
      return false
    } finally {
      setDeleting(false)
    }
  }, [card])

  const refreshCard = useCallback(async () => {
    await loadCard()
  }, [loadCard])

  return {
    card,
    loading,
    error,
    deleting,
    loadCard,
    deleteCard,
    refreshCard
  }
}