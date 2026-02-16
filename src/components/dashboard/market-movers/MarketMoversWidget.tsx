/**
 * MarketMoversWidget Component (Server Component)
 *
 * Displays the user's collection cards with the biggest price movements.
 * Fetches data server-side and passes to client component for
 * interactive time period selection and sorting.
 *
 * Returns null if user has no cards with price data.
 */

import { TrendingUp } from 'lucide-react'
import { getMarketMovers } from '@/lib/market-movers-server'
import WidgetSection from '@/components/widgets/WidgetSection'
import MarketMoversClient from './MarketMoversClient'

export default async function MarketMoversWidget() {
  const { cards } = await getMarketMovers()

  // Don't render widget if no cards have price change data
  if (cards.length === 0) {
    return null
  }

  return (
    <WidgetSection
      title="Market Movers"
      icon={<TrendingUp className="w-5 h-5" />}
      viewAllHref="/collection"
      viewAllLabel="View Collection"
    >
      <MarketMoversClient cards={cards} />
    </WidgetSection>
  )
}
