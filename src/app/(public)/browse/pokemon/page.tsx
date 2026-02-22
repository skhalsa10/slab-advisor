import { getPokemonBrowseDataServer } from '@/lib/pokemon-db-server'
import PokemonBrowseClient from './PokemonBrowseClient'

export default async function PokemonBrowsePage() {
  try {
    const { sets, series } = await getPokemonBrowseDataServer()

    return (
      <PokemonBrowseClient initialSets={sets} seriesOptions={series} />
    )
  } catch (error) {
    console.error('Error fetching browse data in server component:', error)
    throw error // This will be caught by error.tsx
  }
}
