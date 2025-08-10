import Link from 'next/link'
import AppNavigation from '@/components/layout/AppNavigation'

export default function ExplorePage() {
  const tcgGames = [
    {
      id: 'pokemon',
      name: 'Pokémon',
      description: 'Explore Pokémon trading cards from all series and sets',
      logo: '/pokemon-logo.png',
      available: true,
      href: '/browse/pokemon'
    },
    {
      id: 'yugioh',
      name: 'Yu-Gi-Oh!',
      description: 'Coming soon - Browse Yu-Gi-Oh! cards',
      logo: '/yugioh-logo.png',
      available: false,
      href: '#'
    },
    {
      id: 'magic',
      name: 'Magic: The Gathering',
      description: 'Coming soon - Discover Magic cards',
      logo: '/magic-logo.png',
      available: false,
      href: '#'
    },
    {
      id: 'sports',
      name: 'Sports Cards',
      description: 'Coming soon - Basketball, Baseball, Football, and more',
      logo: '/sports-logo.png',
      available: false,
      href: '#'
    }
  ]

  return (
    <AppNavigation>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grey-900">Explore Trading Cards</h1>
        <p className="mt-1 text-sm text-grey-600">
          Browse and discover trading cards from various games and sports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tcgGames.map((game) => (
          <div
            key={game.id}
            className={`relative bg-white rounded-lg border ${
              game.available ? 'border-grey-200 hover:border-orange-300' : 'border-grey-200'
            } transition-all duration-200`}
          >
            {game.available ? (
              <Link href={game.href} className="block p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-grey-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🎴</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-grey-900">
                      {game.name}
                    </h3>
                    <p className="mt-1 text-sm text-grey-600">
                      {game.description}
                    </p>
                    <div className="mt-3">
                      <span className="inline-flex items-center text-sm font-medium text-orange-600">
                        Browse cards
                        <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-6 opacity-60">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-grey-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl opacity-50">🎴</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-grey-900">
                      {game.name}
                    </h3>
                    <p className="mt-1 text-sm text-grey-600">
                      {game.description}
                    </p>
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-grey-100 text-grey-800">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
        <h2 className="text-lg font-semibold text-orange-900">More TCGs Coming Soon!</h2>
        <p className="mt-2 text-sm text-orange-700">
          We&apos;re working on adding support for more trading card games and sports cards. 
          Check back regularly for updates or let us know which games you&apos;d like to see next.
        </p>
      </div>
      </div>
    </AppNavigation>
  )
}