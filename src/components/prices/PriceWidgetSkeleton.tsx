import type { PriceWidgetSkeletonProps } from '@/types/prices';

/**
 * Loading skeleton for the PriceWidget.
 * Matches the 3-zone structure for seamless loading transition.
 */
export function PriceWidgetSkeleton({ className = '' }: PriceWidgetSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col animate-pulse ${className}`}
    >
      {/* ZONE 1: HEADER */}
      <div className="p-5 border-b border-gray-100">
        {/* Top row: Label + Mode Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-28 bg-gray-200 rounded-lg" />
          </div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        </div>

        {/* Hero row: Price + Trend */}
        <div className="flex items-baseline gap-3">
          <div className="h-10 w-32 bg-gray-200 rounded" />
          <div className="h-6 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* ZONE 2: CHART */}
      <div className="h-48 sm:h-64 bg-gray-100 flex items-center justify-center">
        <div className="w-3/4 h-3/4 bg-gray-200 rounded-lg" />
      </div>

      {/* ZONE 3: FOOTER */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        {/* Time range pills */}
        <div className="flex gap-2">
          <div className="h-8 w-12 bg-gray-200 rounded-lg" />
          <div className="h-8 w-12 bg-gray-200 rounded-lg" />
          <div className="h-8 w-12 bg-gray-200 rounded-lg" />
          <div className="h-8 w-12 bg-gray-200 rounded-lg" />
        </div>

        {/* The Hook placeholder */}
        <div className="text-right">
          <div className="h-3 w-24 bg-gray-200 rounded mb-1" />
          <div className="h-5 w-16 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
