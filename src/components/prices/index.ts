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
 * ```
 */

export { PriceWidget } from './PriceWidget';
export { PriceWidgetServer } from './PriceWidgetServer';
export { PriceWidgetSkeleton } from './PriceWidgetSkeleton';
export { PriceWidgetEmpty } from './PriceWidgetEmpty';
