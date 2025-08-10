import Link from 'next/link'
import { TCGGame } from '@/constants/tcg-games'

interface GameCardProps {
  game: TCGGame
}

export default function GameCard({ game }: GameCardProps) {
  const cardContent = (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-16 h-16 bg-grey-100 rounded-lg flex items-center justify-center">
        <span className={`text-2xl ${!game.available ? 'opacity-50' : ''}`}>🎴</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-grey-900">{game.name}</h3>
        <p className="mt-1 text-sm text-grey-600">{game.description}</p>
        <div className="mt-3">
          {game.available ? (
            <span className="inline-flex items-center text-sm font-medium text-orange-600">
              Browse cards
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-grey-100 text-grey-800">
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div
      className={`relative bg-white rounded-lg border ${
        game.available ? 'border-grey-200 hover:border-orange-300' : 'border-grey-200'
      } transition-all duration-200`}
    >
      {game.available ? (
        <Link href={game.href} className="block p-6">
          {cardContent}
        </Link>
      ) : (
        <div className="p-6 opacity-60">
          {cardContent}
        </div>
      )}
    </div>
  )
}