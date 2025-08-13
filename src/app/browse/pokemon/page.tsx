import { getAllSetsWithSeriesServer } from '@/lib/pokemon-db-server'
import AppNavigation from '@/components/layout/AppNavigation'
import PokemonBrowseClient from './PokemonBrowseClient'

export default async function PokemonBrowsePage() {
  try {
    const sets = await getAllSetsWithSeriesServer()
    
    return (
      <AppNavigation>
        <PokemonBrowseClient initialSets={sets} />
      </AppNavigation>
    )
  } catch (error) {
    console.error('Error fetching sets in server component:', error)
    throw error // This will be caught by error.tsx
  }
}