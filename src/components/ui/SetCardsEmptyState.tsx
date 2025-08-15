interface SetCardsEmptyStateProps {
  searchQuery?: string
  hasCards: boolean
  cardType?: string
  customNoDataMessage?: string
  customNoResultsMessage?: string
}

export default function SetCardsEmptyState({
  searchQuery,
  hasCards,
  cardType = "Card",
  customNoDataMessage,
  customNoResultsMessage
}: SetCardsEmptyStateProps) {
  return (
    <div className="text-center py-12">
      {searchQuery ? (
        <p className="text-grey-600">
          {customNoResultsMessage || `No cards found matching "${searchQuery}"`}
        </p>
      ) : !hasCards ? (
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-grey-100 mb-2">
            <svg className="w-8 h-8 text-grey-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-grey-900 mb-1">
              {customNoDataMessage || `${cardType} data not yet available`}
            </h3>
          </div>
        </div>
      ) : (
        <p className="text-grey-600">No cards found</p>
      )}
    </div>
  )
}