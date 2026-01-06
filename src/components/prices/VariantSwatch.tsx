'use client';

import { usePriceWidget } from './PriceWidgetContext';

interface VariantSwatchProps {
  className?: string;
}

/**
 * Standalone variant selector component.
 * Displays pills for available variants (Normal, Reverse Holofoil, etc.)
 * and syncs with PriceWidget via shared context.
 *
 * Only renders when:
 * - Inside a PriceWidgetProvider
 * - In Raw view mode (not Graded)
 * - Multiple variants are available
 */
export function VariantSwatch({ className = '' }: VariantSwatchProps) {
  const { viewMode, variant, setVariant, availableVariants } = usePriceWidget();

  // Don't render if not in Raw mode or only one variant
  if (viewMode !== 'Raw' || availableVariants.length <= 1) {
    return null;
  }

  return (
    <div className={`flex gap-2 flex-wrap ${className}`}>
      {availableVariants.map((v) => (
        <button
          key={v}
          onClick={() => setVariant(v)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            variant === v
              ? 'bg-gray-800 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
