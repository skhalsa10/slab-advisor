import Link from 'next/link'

interface PokemonHeroCardProps {
  href?: string
}

export default function PokemonHeroCard({ href = '/browse/pokemon' }: PokemonHeroCardProps) {
  return (
    <Link
      href={href}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-xl border border-grey-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 transition-all duration-300 hover:border-orange-300 hover:shadow-md">
        {/* Subtle background decoration */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-100/50 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-amber-100/50 blur-2xl" />

        {/* Content */}
        <div className="relative flex items-center justify-between p-6 md:p-8">
          {/* Text content */}
          <div>
            <h2 className="text-lg font-semibold text-grey-900 md:text-xl">
              Pokémon Trading Cards
            </h2>
            <p className="mt-1 text-sm text-grey-600">
              Explore cards from all series and sets
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="flex-shrink-0 ml-4">
            <svg
              className="h-5 w-5 text-grey-400 transition-all duration-200 group-hover:text-orange-500 group-hover:translate-x-0.5"
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
          </div>
        </div>
      </div>
    </Link>
  )
}
