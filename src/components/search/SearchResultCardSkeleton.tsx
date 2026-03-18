/**
 * SearchResultCardSkeleton Component
 *
 * Skeleton loading placeholder that matches SearchResultCard dimensions exactly.
 * Used during search loading state to prevent jarring height changes.
 */
export default function SearchResultCardSkeleton() {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Image skeleton - matches aspect-[3/4] of real card */}
      <div className="aspect-[3/4] bg-secondary animate-pulse" />

      {/* Info skeleton - matches p-3 space-y-2 of real card */}
      <div className="p-3 space-y-2">
        {/* Card name */}
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
        {/* Set name */}
        <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        {/* Number and rarity row */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 bg-muted rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted rounded animate-pulse" />
        </div>
        {/* Add button */}
        <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}
