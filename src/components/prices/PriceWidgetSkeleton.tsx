import type { PriceWidgetSkeletonProps } from '@/types/prices';

/**
 * Loading skeleton for the PriceWidget.
 * Matches the 3-zone structure for seamless loading transition.
 */
export function PriceWidgetSkeleton({ className = '' }: PriceWidgetSkeletonProps) {
  return (
    <div
      className={`bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col animate-pulse ${className}`}
    >
      {/* ZONE 1: HEADER */}
      <div className="p-5 border-b border-border">
        {/* Top row: Label + Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 bg-muted rounded" />
            <div className="h-8 w-28 bg-muted rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-muted rounded-lg" />
        </div>

        {/* Hero row: Price + Trend */}
        <div className="flex items-baseline gap-3">
          <div className="h-10 w-32 bg-muted rounded" />
          <div className="h-6 w-20 bg-muted rounded-full" />
        </div>
      </div>

      {/* ZONE 2: CHART */}
      <div className="h-48 sm:h-64 bg-secondary flex items-center justify-center">
        <div className="w-3/4 h-3/4 bg-muted rounded-lg" />
      </div>

      {/* ZONE 3: FOOTER */}
      <div className="px-5 py-4 border-t border-border flex items-center justify-between">
        {/* Time range pills */}
        <div className="flex gap-2">
          <div className="h-8 w-12 bg-muted rounded-lg" />
          <div className="h-8 w-12 bg-muted rounded-lg" />
          <div className="h-8 w-12 bg-muted rounded-lg" />
          <div className="h-8 w-12 bg-muted rounded-lg" />
        </div>

        {/* The Hook placeholder */}
        <div className="text-right">
          <div className="h-3 w-24 bg-muted rounded mb-1" />
          <div className="h-5 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
