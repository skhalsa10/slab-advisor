import Link from 'next/link'
import Image from 'next/image'
import { getTopCardsFromNewestSetsServer } from '@/lib/pokemon-db-server'
import { getCardImageUrl } from '@/lib/pokemon-db'

/**
 * Pokemon Hero Section with dark gradient and fanned cards
 *
 * Design inspired by modern TCG sites:
 * - Dark gradient background with subtle pattern
 * - White text for contrast
 * - Cards fanned dramatically on the right, overlapping container
 * - Orange CTA button
 */
export default async function PokemonHeroSection() {
  // Fetch cards for the fan display
  const cards = await getTopCardsFromNewestSetsServer(3, 2)

  // Fan cards on the right side - positioned to leave room for button
  const cardStyles = [
    { right: '42%', rotate: -15, zIndex: 1 },
    { right: '32%', rotate: -5, zIndex: 2 },
    { right: '22%', rotate: 5, zIndex: 3 },
    { right: '12%', rotate: 15, zIndex: 4 },
    { right: '4%', rotate: 25, zIndex: 5 },
  ]

  return (
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-grey-900 via-grey-800 to-grey-900">
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Gradient overlay for depth - left side for text */}
      <div className="absolute inset-0 bg-gradient-to-r from-grey-900/90 via-grey-900/70 to-transparent" />

      {/* Dark gradient on right side - ensures button visibility against any card colors */}
      <div className="hidden sm:block absolute inset-y-0 right-0 w-56 bg-gradient-to-l from-grey-900 via-grey-900/80 to-transparent z-[6]" />

      {/* Fanned cards - positioned to overlap right edge */}
      <div className="hidden sm:block">
        {cards.slice(0, 5).map((card, index) => {
          const imageUrl = getCardImageUrl(
            card.image || undefined,
            'low',
            card.tcgplayer_image_url || undefined
          )
          const style = cardStyles[index] || cardStyles[cardStyles.length - 1]
          return (
            <div
              key={card.id}
              className="absolute w-32 sm:w-36 md:w-40 lg:w-44 aspect-[2.5/3.5] rounded-lg overflow-hidden shadow-2xl"
              style={{
                right: style.right,
                top: '50%',
                transform: `translateY(-50%) rotate(${style.rotate}deg)`,
                zIndex: style.zIndex,
              }}
            >
              <Image
                src={imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
          )
        })}
      </div>

      {/* Content */}
      <div className="relative px-6 py-10 sm:px-8 sm:py-12 md:py-14 z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Text - shrinks on medium screens to make room for button */}
        <div className="flex-shrink min-w-0 lg:max-w-[50%]">
          <h2 className="text-2xl font-bold text-white sm:text-3xl tracking-tight uppercase">
            Pokemon Trading Cards
          </h2>
          <p className="mt-2 text-white/90 sm:text-lg" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)' }}>
            Explore all series, sets, and prices
          </p>
        </div>

        {/* CTA Button - stacks on mobile/tablet, inline on large screens */}
        <Link
          href="/browse/pokemon"
          className="flex-shrink-0 self-start lg:self-center inline-flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-orange-600 transition-colors"
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
