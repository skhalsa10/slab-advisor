import Link from 'next/link'
import Image from 'next/image'
import { getTopCardsFromNewestSetsServer } from '@/lib/pokemon-db-server'
import { getCardImageUrl } from '@/lib/pokemon-db'

/**
 * Pokemon Hero Section with fanned card background
 *
 * Clean design with:
 * - Text and CTA on the left
 * - Fanned/stacked cards popping above container
 * - Cards anchored at bottom of hero
 */
export default async function PokemonHeroSection() {
  // Fetch cards for background fan - get more to ensure we have 4
  const cards = await getTopCardsFromNewestSetsServer(4, 2)

  // Fan cards from left to right with increasing rotation
  const cardStyles = [
    { left: '35%', rotate: -18, zIndex: 1 },
    { left: '45%', rotate: -6, zIndex: 2 },
    { left: '55%', rotate: 6, zIndex: 3 },
    { left: '65%', rotate: 18, zIndex: 4 },
  ]

  return (
    <div className="relative rounded-xl border border-grey-200 bg-white">
      {/* Fanned cards - positioned relative to main container */}
      <div className="hidden sm:block">
        {cards.slice(0, 4).map((card, index) => {
          const imageUrl = getCardImageUrl(
            card.image || undefined,
            'low',
            card.tcgplayer_image_url || undefined
          )
          const style = cardStyles[index]
          return (
            <div
              key={card.id}
              className="absolute w-20 lg:w-24 aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-xl opacity-60"
              style={{
                left: style.left,
                bottom: '15px',
                transform: `rotate(${style.rotate}deg)`,
                transformOrigin: 'bottom center',
                zIndex: style.zIndex,
              }}
            >
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10">
        {/* Left: Text */}
        <div className="max-w-md">
          <h2 className="text-2xl font-bold text-grey-900 sm:text-3xl">
            Pokemon Trading Cards
          </h2>
          <p className="mt-2 text-grey-600 sm:text-lg">
            Explore all series, sets, and prices
          </p>
        </div>

        {/* Spacer for cards area */}
        <div className="hidden sm:block flex-1" />

        {/* CTA */}
        <Link
          href="/browse/pokemon"
          className="self-start sm:self-auto flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
        >
          Browse Sets
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
