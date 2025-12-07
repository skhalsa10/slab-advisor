export interface TCGGame {
  id: string
  name: string
  description: string
  available: boolean
  href: string
}

// Currently available TCGs - add more as they become available
export const TCG_GAMES: TCGGame[] = [
  {
    id: 'pokemon',
    name: 'Pokémon',
    description: 'Explore cards from all series and sets',
    available: true,
    href: '/browse/pokemon'
  }
]

// Convenience export for the primary TCG
export const POKEMON_TCG = TCG_GAMES[0]