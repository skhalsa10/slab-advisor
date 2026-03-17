/**
 * MarketMoversWidgetSkeleton Component
 *
 * Loading skeleton for the Market Movers widget.
 * Displays animated placeholders while data is being fetched.
 */

export default function MarketMoversWidgetSkeleton() {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded animate-pulse" />
          <div className="w-32 h-5 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-28 h-4 bg-muted rounded animate-pulse" />
      </div>

      <div className="p-4">
        {/* Time period pills skeleton */}
        <div className="flex gap-1 mb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-12 h-8 bg-muted rounded-lg animate-pulse"
            />
          ))}
        </div>

        {/* Card placeholders - horizontal row */}
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-36 sm:w-40 rounded-lg bg-secondary animate-pulse overflow-hidden"
            >
              {/* Card image placeholder */}
              <div className="aspect-[2.5/3.5] bg-muted" />
              {/* Card info placeholder */}
              <div className="p-2 space-y-2">
                <div className="h-3 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-5 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
