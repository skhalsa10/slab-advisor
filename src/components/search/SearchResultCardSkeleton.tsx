/**
 * SearchResultCardSkeleton Component
 *
 * Skeleton loading placeholder that matches SearchResultCard dimensions exactly.
 * Used during search loading state to prevent jarring height changes.
 */
export default function SearchResultCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-grey-200 overflow-hidden">
      {/* Image skeleton - matches aspect-[3/4] of real card */}
      <div className="aspect-[3/4] bg-grey-100 animate-pulse" />

      {/* Info skeleton - matches p-3 space-y-2 of real card */}
      <div className="p-3 space-y-2">
        {/* Card name */}
        <div className="h-4 w-3/4 bg-grey-200 rounded animate-pulse" />
        {/* Set name */}
        <div className="h-3 w-1/2 bg-grey-200 rounded animate-pulse" />
        {/* Number and rarity row */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 bg-grey-200 rounded animate-pulse" />
          <div className="h-3 w-12 bg-grey-200 rounded animate-pulse" />
        </div>
        {/* Add button */}
        <div className="h-10 w-full bg-grey-200 rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
