/**
 * Price widget components for displaying card market prices.
 *
 * @example
 * ```tsx
 * // Server-side usage (recommended)
 * import { Suspense } from 'react';
 * import { PriceWidgetServer, PriceWidgetSkeleton } from '@/components/prices';
 *
 * <Suspense fallback={<PriceWidgetSkeleton />}>
 *   <PriceWidgetServer cardId={card.id} />
 * </Suspense>
 *
 * // Client-side usage (if data already fetched)
 * import { PriceWidget } from '@/components/prices';
 *
 * <PriceWidget priceData={priceData} />
 *
 * // Distributed UI with shared context
 * import { PriceWidgetProvider, VariantSwatch, PriceWidget } from '@/components/prices';
 *
 * <PriceWidgetProvider priceData={priceData}>
 *   <VariantSwatch className="mt-2" />
 *   <PriceWidget hideVariantSwatch />
 * </PriceWidgetProvider>
 * ```
 */

export { PriceWidget } from './PriceWidget';
export { PriceWidgetServer } from './PriceWidgetServer';
export { PriceWidgetSkeleton } from './PriceWidgetSkeleton';
export { PriceWidgetEmpty } from './PriceWidgetEmpty';
export { PriceWidgetProvider, usePriceWidget, usePriceWidgetContext } from './PriceWidgetContext';
export { VariantSwatch } from './VariantSwatch';
export { PriceHeadline } from './PriceHeadline';
