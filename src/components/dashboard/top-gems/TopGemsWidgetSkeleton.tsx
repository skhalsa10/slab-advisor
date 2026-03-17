/**
 * TopGemsWidgetSkeleton Component
 *
 * Loading skeleton for the Top Gems widget.
 * Displays animated placeholders while data is being fetched.
 */

export default function TopGemsWidgetSkeleton() {
  return (
    <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-muted rounded animate-pulse" />
          <div className="w-24 h-5 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-28 h-4 bg-muted rounded animate-pulse" />
      </div>

      {/* Content skeleton - 3 card placeholders */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl bg-secondary animate-pulse overflow-hidden"
            >
              {/* Card image placeholder */}
              <div className="aspect-[2.5/3.5] bg-muted" />
              {/* Card info placeholder */}
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
                <div className="h-6 w-1/3 bg-muted rounded mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
