export interface TCGGame {
  id: string
  name: string
  description: string
  logo: string
  available: boolean
  href: string
}

export const TCG_GAMES: TCGGame[] = [
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