/**
 * MarketMoversWidgetSkeleton Component
 *
 * Loading skeleton for the Market Movers widget.
 * Displays animated placeholders while data is being fetched.
 */

export default function MarketMoversWidgetSkeleton() {
  return (
    <section className="bg-white rounded-2xl border border-grey-100 shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-grey-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-grey-200 rounded animate-pulse" />
          <div className="w-32 h-5 bg-grey-200 rounded animate-pulse" />
        </div>
        <div className="w-28 h-4 bg-grey-200 rounded animate-pulse" />
      </div>

      <div className="p-4">
        {/* Time period pills skeleton */}
        <div className="flex gap-1 mb-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-12 h-8 bg-grey-200 rounded-lg animate-pulse"
            />
          ))}
        </div>

        {/* Card placeholders - horizontal row */}
        <div className="flex gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-36 sm:w-40 rounded-lg bg-grey-100 animate-pulse overflow-hidden"
            >
              {/* Card image placeholder */}
              <div className="aspect-[2.5/3.5] bg-grey-200" />
              {/* Card info placeholder */}
              <div className="p-2 space-y-2">
                <div className="h-3 w-3/4 bg-grey-200 rounded" />
                <div className="h-4 w-1/3 bg-grey-200 rounded" />
                <div className="h-5 w-1/2 bg-grey-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
