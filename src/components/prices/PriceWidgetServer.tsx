import { getCardPrices } from '@/actions/prices';
import { PriceWidget } from './PriceWidget';
import { PriceWidgetEmpty } from './PriceWidgetEmpty';
import type { PriceWidgetServerProps } from '@/types/prices';

/**
 * Server component wrapper for PriceWidget.
 * Fetches price data server-side and passes it to the client component.
 *
 * @example
 * ```tsx
 * import { Suspense } from 'react';
 * import { PriceWidgetServer, PriceWidgetSkeleton } from '@/components/prices';
 *
 * <Suspense fallback={<PriceWidgetSkeleton />}>
 *   <PriceWidgetServer cardId="sv10-190" />
 * </Suspense>
 * ```
 */
export async function PriceWidgetServer({
  cardId,
  className,
}: PriceWidgetServerProps) {
  const { data: priceData, error } = await getCardPrices(cardId);

  // If there's an error or no data, show empty state
  if (error || !priceData) {
    return <PriceWidgetEmpty className={className} />;
  }

  return <PriceWidget priceData={priceData} className={className} />;
}
