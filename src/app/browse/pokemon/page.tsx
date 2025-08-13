import { getPokemonBrowseDataServer } from '@/lib/pokemon-db-server'
import AppNavigation from '@/components/layout/AppNavigation'
import PokemonBrowseClient from './PokemonBrowseClient'

export default async function PokemonBrowsePage() {
  try {
    const { sets, series } = await getPokemonBrowseDataServer()
    
    return (
      <AppNavigation>
        <PokemonBrowseClient initialSets={sets} seriesOptions={series} />
      </AppNavigation>
    )
  } catch (error) {
    console.error('Error fetching browse data in server component:', error)
    throw error // This will be caught by error.tsx
  }
}