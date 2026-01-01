import type { PriceWidgetEmptyProps } from '@/types/prices';

/**
 * Empty state component for the PriceWidget.
 * Shown when no price data is available for a card.
 */
export function PriceWidgetEmpty({
  message = 'Price Data Not Available',
  className = '',
}: PriceWidgetEmptyProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center ${className}`}
    >
      {/* Chart icon - muted */}
      <svg
        className="w-12 h-12 text-gray-300 mx-auto mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>

      <h3 className="text-gray-700 font-medium mb-1">{message}</h3>
      <p className="text-gray-500 text-sm">
        We don&apos;t have pricing information for this card yet.
      </p>
    </div>
  );
}
