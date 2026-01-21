import { getTopMoversServer } from '@/lib/top-movers-server'
import { getCardImageUrl } from '@/lib/pokemon-db'
import WidgetSection from './WidgetSection'
import HorizontalScroll from './HorizontalScroll'
import TCGCard from '@/components/cards/TCGCard'

interface TopMoversWidgetProps {
  limit?: number
}

/**
 * Widget showing top cards with biggest 7-day price gains
 *
 * This is a Server Component that fetches cards with the highest
 * positive price change over the past 7 days.
 *
 * Features:
 * - Horizontal scrolling carousel
 * - Shows price change percentage badge
 * - Links to card detail pages
 */
export default async function TopMoversWidget({
  limit = 10,
}: TopMoversWidgetProps) {
  const cards = await getTopMoversServer(limit)

  if (cards.length === 0) {
    return null
  }

  return (
    <WidgetSection title="Trending This Week">
      <HorizontalScroll>
        {cards.map((card) => {
          // Pre-compute image URL on server
          const imageUrl = getCardImageUrl(
            card.image || undefined,
            'low',
            card.tcgplayer_image_url || undefined
          )

          // Format percentage change for display
          const changePercent = card.change_7d_percent.toFixed(1)

          return (
            <div key={card.id} className="flex-shrink-0 snap-start w-36 sm:w-40">
              <TCGCard
                card={{
                  id: card.id,
                  name: card.name,
                  image: imageUrl,
                  // Show the percentage change as metadata
                  metadata: [{ value: `+${changePercent}%` }],
                  // Pass the price directly
                  price: card.current_market_price,
                }}
                href={`/browse/pokemon/${card.set.id}/${card.id}`}
              />
            </div>
          )
        })}
      </HorizontalScroll>
    </WidgetSection>
  )
}
