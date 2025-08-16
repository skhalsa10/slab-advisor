interface SetStatisticsProps {
  totalCards: number
  officialCount?: number | null
  holoCount?: number | null
  reverseCount?: number | null
  firstEditionCount?: number | null
}

export default function SetStatistics({
  totalCards,
  officialCount,
  holoCount,
  reverseCount,
  firstEditionCount
}: SetStatisticsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
        {/* Primary stats - always visible */}
        <div className="bg-grey-50 rounded-lg px-8 py-4 min-w-0">
          <p className="text-xs text-grey-600 mb-2">Total Cards</p>
          <p className="text-2xl font-bold text-grey-900">{totalCards || 0}</p>
        </div>
        
        {officialCount !== null && officialCount !== undefined && (
          <div className="bg-grey-50 rounded-lg px-8 py-4 min-w-0">
            <p className="text-xs text-grey-600 mb-2">Official Count</p>
            <p className="text-2xl font-bold text-grey-900">{officialCount}</p>
          </div>
        )}
        
        {/* Secondary stats - only show if they have values > 0 */}
        {holoCount !== null && holoCount !== undefined && holoCount > 0 && (
          <div className="bg-grey-50 rounded-lg px-8 py-4 min-w-0">
            <p className="text-xs text-grey-600 mb-2">Holo Cards</p>
            <p className="text-xl font-semibold text-grey-900">{holoCount}</p>
          </div>
        )}
        
        {reverseCount !== null && reverseCount !== undefined && reverseCount > 0 && (
          <div className="bg-grey-50 rounded-lg px-8 py-4 min-w-0">
            <p className="text-xs text-grey-600 mb-2">Reverse Holo</p>
            <p className="text-xl font-semibold text-grey-900">{reverseCount}</p>
          </div>
        )}
        
        {firstEditionCount !== null && firstEditionCount !== undefined && firstEditionCount > 0 && (
          <div className="bg-grey-50 rounded-lg px-8 py-4 min-w-0">
            <p className="text-xs text-grey-600 mb-2">1st Edition</p>
            <p className="text-xl font-semibold text-grey-900">{firstEditionCount}</p>
          </div>
        )}
    </div>
  )
}