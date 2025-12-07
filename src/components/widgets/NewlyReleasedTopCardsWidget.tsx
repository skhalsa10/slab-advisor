import { getTopCardsFromNewestSetsServer } from '@/lib/pokemon-db-server'
import { getCardImageUrl } from '@/lib/pokemon-db'
import WidgetSection from './WidgetSection'
import HorizontalScroll from './HorizontalScroll'
import TCGCard from '@/components/cards/TCGCard'

interface NewlyReleasedTopCardsWidgetProps {
  numSets?: number
  cardsPerSet?: number
}

/**
 * Self-contained widget showing top priced cards from newest sets
 *
 * This is a server component that fetches its own data.
 * Can be placed anywhere in the app without additional setup.
 *
 * Features:
 * - Horizontal scrolling carousel
 * - Shows highest-priced cards from recent sets
 * - Reuses TCGCard component for visual consistency
 * - Links to card detail pages
 */
export default async function NewlyReleasedTopCardsWidget({
  numSets = 2,
  cardsPerSet = 5
}: NewlyReleasedTopCardsWidgetProps) {
  const cards = await getTopCardsFromNewestSetsServer(numSets, cardsPerSet)

  if (cards.length === 0) {
    return null
  }

  return (
    <WidgetSection title="Newly Released Top Cards" viewAllHref="/browse/pokemon">
      <HorizontalScroll>
        {cards.map((card) => {
          // Pre-compute image URL on server
          const imageUrl = getCardImageUrl(
            card.image || undefined,
            'low',
            card.tcgplayer_image_url || undefined
          )

          return (
            <div key={card.id} className="flex-shrink-0 snap-start w-36 sm:w-40">
              <TCGCard
                card={{
                  id: card.id,
                  name: card.name,
                  image: imageUrl,
                  priceData: card.price_data
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
