import { TCGGame } from '@/constants/tcg-games'
import GameCard from './GameCard'

interface GameGridProps {
  games: TCGGame[]
}

export default function GameGrid({ games }: GameGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  )
}