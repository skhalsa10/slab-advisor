'use client'

import { useState, useCallback, useRef } from 'react'
import { trackCardAdded, trackSearch } from '@/lib/posthog/events'

export interface SearchResult {
  id: string
  name: string
  local_id: string | null
  image: string | null
  tcgplayer_image_url: string | null
  rarity: string | null
  set_name: string
  set_id: string
  card_type: 'pokemon'
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  limit: number
  message?: string
}

interface UseQuickAddReturn {
  // Search state
  query: string
  results: SearchResult[]
  loading: boolean
  error: string | null
  
  // Search actions
  setQuery: (query: string) => void
  clearSearch: () => void
  
  // Modal state
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
  
  // Add to collection
  addToCollection: (cardId: string, variant: string, quantity: number) => Promise<boolean>
  addingCardId: string | null
}

/**
 * Hook for managing Quick Add functionality
 * 
 * Provides state management and API calls for the quick add feature.
 * Handles debounced search, loading states, error handling, and add to collection.
 * Can be used globally or within specific components.
 * 
 * @param debounceMs - Debounce delay in milliseconds (default: 500)
 * @returns Object containing search state and control functions
 * 
 * @example
 * ```typescript
 * const {
 *   query,
 *   setQuery,
 *   results,
 *   loading,
 *   isOpen,
 *   openModal,
 *   closeModal,
 *   addToCollection
 * } = useQuickAdd()
 * ```
 */
export function useQuickAdd(debounceMs: number = 500): UseQuickAddReturn {
  // Search state
  const [query, setQueryState] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false)
  
  // Add to collection state
  const [addingCardId, setAddingCardId] = useState<string | null>(null)
  
  // Refs for cleanup
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Search function that calls API
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      // Allow structured queries and exact ID queries with less than 2 chars
      if (!searchQuery.startsWith('#') && !searchQuery.includes(':')) {
        setResults([])
        setLoading(false)
        return
      }
    }

    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController()
      
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/pokemon/search?q=${encodeURIComponent(searchQuery.trim())}&limit=50`,
        {
          signal: abortControllerRef.current.signal,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = 'Search failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || `Search failed (${response.status})`
        } catch {
          errorMessage = `Search failed (${response.status}: ${response.statusText})`
        }
        throw new Error(errorMessage)
      }

      const data: SearchResponse = await response.json()

      setResults(data.results || [])

      trackSearch({
        query: searchQuery.trim(),
        resultsCount: data.results?.length || 0
      })

      if (data.message && data.results.length === 0) {
        setError(data.message)
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was aborted, ignore
        return
      }
      
      console.error('Search error:', err)
      setError('Failed to search cards. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced query setter
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery)
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    // Clear error when user types
    if (error) {
      setError(null)
    }
    
    // Set new debounce
    debounceRef.current = setTimeout(() => {
      performSearch(newQuery)
    }, debounceMs)
  }, [performSearch, debounceMs, error])

  const clearSearch = useCallback(() => {
    setQueryState('')
    setResults([])
    setError(null)
    setLoading(false)
    
    // Cancel pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Clear debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    // Clear search when closing
    clearSearch()
  }, [clearSearch])

  // Add to collection function
  const addToCollection = useCallback(async (
    cardId: string, 
    variant: string, 
    quantity: number
  ): Promise<boolean> => {
    try {
      setAddingCardId(cardId)
      
      const response = await fetch('/api/collection/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'known-card',
          pokemon_card_id: cardId,
          variant,
          quantity,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add card to collection')
      }

      const result = await response.json()

      trackCardAdded({
        source: 'manual',
        category: 'pokemon',
        cardId: cardId
      })

      // Success - could show toast notification here
      console.log('Added to collection:', result.message)
      return true
      
    } catch (err) {
      console.error('Error adding to collection:', err)
      setError(err instanceof Error ? err.message : 'Failed to add card to collection')
      return false
    } finally {
      setAddingCardId(null)
    }
  }, [])

  return {
    // Search state
    query,
    results,
    loading,
    error,
    
    // Search actions
    setQuery,
    clearSearch,
    
    // Modal state
    isOpen,
    openModal,
    closeModal,
    
    // Add to collection
    addToCollection,
    addingCardId
  }
}