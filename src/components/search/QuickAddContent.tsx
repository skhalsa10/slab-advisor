'use client'

import SearchBar from './SearchBar'
import SearchResultCard from './SearchResultCard'
import { useQuickAdd } from '@/hooks/useQuickAdd'
import { getCurrentUser } from '@/lib/auth'

interface QuickAddContentProps {
  onAddSuccess?: (message: string) => void
  onAddError?: (error: string) => void
  onFocusChange?: (isFocused: boolean) => void
  onCameraClick?: () => void
}

/**
 * QuickAddContent Component
 *
 * Main content component for the Quick Add feature.
 * Handles search state, displays results, and manages add to collection flow.
 * Designed to be used inside a QuickView component.
 *
 * @param onAddSuccess - Optional callback when card is successfully added
 * @param onAddError - Optional callback when card add fails
 * @param onFocusChange - Optional callback when search input focus changes
 * @param onCameraClick - Optional callback when camera icon is clicked
 */
export default function QuickAddContent({
  onAddSuccess,
  onAddError,
  onFocusChange,
  onCameraClick
}: QuickAddContentProps) {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
    addToCollection,
    addingCardId
  } = useQuickAdd()
  
  const handleAddToCollection = async (cardId: string, variant: string, quantity: number) => {
    // Authentication guard - check directly with Supabase
    const user = await getCurrentUser()
    if (!user) {
      onAddError?.('You must be logged in to add cards to your collection.')
      return false
    }
    
    const success = await addToCollection(cardId, variant, quantity)
    
    if (success) {
      const card = results.find(c => c.id === cardId)
      const message = `Added ${quantity} ${card?.name || 'card'}(s) to your collection`
      onAddSuccess?.(message)
    } else {
      onAddError?.('Failed to add card to collection. Please try again.')
    }
    
    return success
  }

  const renderEmptyState = () => {
    // No empty state needed when query is empty - the SearchBar hints are sufficient
    if (query.length === 0) {
      return null
    }

    if (query.length > 0 && query.length < 2 && !query.startsWith('#') && !query.includes(':')) {
      return (
        <div className="text-center py-12 px-4">
          <div className="text-4xl mb-4">⌨️</div>
          <p className="text-sm text-grey-600">
            Keep typing... (minimum 2 characters unless using # or structured search)
          </p>
        </div>
      )
    }

    if (results.length === 0 && !loading) {
      return (
        <div className="text-center py-12 px-4">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-lg font-medium text-grey-900 mb-2">No cards found</h3>
          <p className="text-sm text-grey-600 mb-4">
            Try a different search term or check your spelling
          </p>
          <div className="text-xs text-grey-500">
            <p>Search tips:</p>
            <p>• Use simpler terms (try &quot;pikachu&quot; instead of &quot;pikachu ex&quot;)</p>
            <p>• Check spelling of card names and sets</p>
            <p>• Try searching by number only: <span className="font-mono">#181</span></p>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-4 space-y-4">
      {/* Search Input */}
      <SearchBar
        value={query}
        onChange={setQuery}
        className="w-full"
        onFocusChange={onFocusChange}
        onCameraClick={onCameraClick}
        showCameraIcon={!!onCameraClick}
      />

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-sm text-grey-600">Searching cards...</span>
        </div>
      )}

      {/* Empty States */}
      {!loading && renderEmptyState()}

      {/* Search Results */}
      {!loading && results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-grey-900">
              Found {results.length} card{results.length !== 1 ? 's' : ''}
            </h3>
            {query && (
              <button
                onClick={clearSearch}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {results.map((card) => (
              <SearchResultCard
                key={card.id}
                card={card}
                onAddToCollection={handleAddToCollection}
                isAdding={addingCardId === card.id}
              />
            ))}
          </div>

          {/* Results Info */}
          {results.length >= 50 && (
            <div className="mt-4 text-center">
              <p className="text-xs text-grey-500">
                Showing first 50 results. Try a more specific search for better results.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}