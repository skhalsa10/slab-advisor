interface SetStatisticsProps {
  totalCards: number
  officialCount?: number | null
  holoCount?: number | null
  reverseCount?: number | null
  firstEditionCount?: number | null
  seriesName?: string | null
  releaseDate?: string | null
}

export default function SetStatistics({
  totalCards,
  officialCount,
  holoCount,
  reverseCount,
  firstEditionCount,
  seriesName,
  releaseDate
}: SetStatisticsProps) {
  // Format release date for display
  const formattedDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div>
      {/* Mobile: Compact horizontal scrolling pills */}
      <div className="sm:hidden relative -mx-6">
        <div className="flex gap-2 overflow-x-auto px-6 pb-2">
          {seriesName && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
              <span className="text-grey-500 mr-1">Series:</span>
              <span className="font-medium">{seriesName}</span>
            </span>
          )}
          {formattedDate && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
              <span className="text-grey-500 mr-1">Released:</span>
              <span className="font-medium">{formattedDate}</span>
            </span>
          )}
          <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
            <span className="text-grey-500 mr-1">Cards:</span>
            <span className="font-medium">{totalCards || 0}</span>
          </span>
          {officialCount !== null && officialCount !== undefined && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
              <span className="text-grey-500 mr-1">Official:</span>
              <span className="font-medium">{officialCount}</span>
            </span>
          )}
          {holoCount !== null && holoCount !== undefined && holoCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
              <span className="text-grey-500 mr-1">Holo:</span>
              <span className="font-medium">{holoCount}</span>
            </span>
          )}
          {reverseCount !== null && reverseCount !== undefined && reverseCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
              <span className="text-grey-500 mr-1">Reverse:</span>
              <span className="font-medium">{reverseCount}</span>
            </span>
          )}
          {firstEditionCount !== null && firstEditionCount !== undefined && firstEditionCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 rounded-full bg-grey-100 text-sm text-grey-700 whitespace-nowrap">
              <span className="text-grey-500 mr-1">1st Ed:</span>
              <span className="font-medium">{firstEditionCount}</span>
            </span>
          )}
        </div>
        {/* Right gradient fade indicator */}
        <div
          className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Tablet: Inline metadata with bullet separators */}
      <div className="hidden sm:flex xl:hidden sm:flex-wrap sm:items-baseline sm:gap-x-1 sm:gap-y-1 text-sm">
        {seriesName && (
          <>
            <span className="text-grey-500">Series:</span>
            <span className="font-medium text-grey-900">{seriesName}</span>
            <span className="text-grey-400 mx-1">•</span>
          </>
        )}

        {formattedDate && (
          <>
            <span className="text-grey-500">Released:</span>
            <span className="font-medium text-grey-900">{formattedDate}</span>
            <span className="text-grey-400 mx-1">•</span>
          </>
        )}

        <span className="font-medium text-grey-900">{totalCards || 0} Cards</span>

        {officialCount !== null && officialCount !== undefined && (
          <>
            <span className="text-grey-400 mx-1">•</span>
            <span className="font-medium text-grey-900">{officialCount} Official</span>
          </>
        )}

        {holoCount !== null && holoCount !== undefined && holoCount > 0 && (
          <>
            <span className="text-grey-400 mx-1">•</span>
            <span className="font-medium text-grey-900">{holoCount} Holo</span>
          </>
        )}

        {reverseCount !== null && reverseCount !== undefined && reverseCount > 0 && (
          <>
            <span className="text-grey-400 mx-1">•</span>
            <span className="font-medium text-grey-900">{reverseCount} Reverse</span>
          </>
        )}

        {firstEditionCount !== null && firstEditionCount !== undefined && firstEditionCount > 0 && (
          <>
            <span className="text-grey-400 mx-1">•</span>
            <span className="font-medium text-grey-900">{firstEditionCount} 1st Ed</span>
          </>
        )}
      </div>

      {/* Desktop: Premium Key/Value Grid */}
      <div className="hidden xl:grid xl:grid-cols-2 xl:gap-x-8 xl:gap-y-4">
        {/* Row 1: Series & Released */}
        {seriesName && (
          <div>
            <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">Series</dt>
            <dd className="mt-1 text-sm font-semibold text-grey-900">{seriesName}</dd>
          </div>
        )}
        {formattedDate && (
          <div>
            <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">Released</dt>
            <dd className="mt-1 text-sm font-semibold text-grey-900">{formattedDate}</dd>
          </div>
        )}

        {/* Row 2: Total Cards & Official */}
        <div>
          <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">Total Cards</dt>
          <dd className="mt-1 text-sm font-semibold text-grey-900">{totalCards || 0}</dd>
        </div>
        {officialCount !== null && officialCount !== undefined && (
          <div>
            <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">Official</dt>
            <dd className="mt-1 text-sm font-semibold text-grey-900">{officialCount}</dd>
          </div>
        )}

        {/* Optional Row 3: Holo & Reverse (only if they have values) */}
        {holoCount !== null && holoCount !== undefined && holoCount > 0 && (
          <div>
            <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">Holo</dt>
            <dd className="mt-1 text-sm font-semibold text-grey-900">{holoCount}</dd>
          </div>
        )}
        {reverseCount !== null && reverseCount !== undefined && reverseCount > 0 && (
          <div>
            <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">Reverse</dt>
            <dd className="mt-1 text-sm font-semibold text-grey-900">{reverseCount}</dd>
          </div>
        )}

        {/* Optional: 1st Edition */}
        {firstEditionCount !== null && firstEditionCount !== undefined && firstEditionCount > 0 && (
          <div>
            <dt className="text-xs font-medium text-grey-500 uppercase tracking-wider">1st Edition</dt>
            <dd className="mt-1 text-sm font-semibold text-grey-900">{firstEditionCount}</dd>
          </div>
        )}
      </div>
    </div>
  )
}