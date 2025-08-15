import { getSetWithCardsAndProductsServer } from '@/lib/pokemon-db-server'
import AppNavigation from '@/components/layout/AppNavigation'
import SetDetailClient from './SetDetailClient'

interface SetDetailsPageProps {
  params: Promise<{
    setId: string
  }>
}

/**
 * Pokemon Set Detail Page - Server Component
 * Fetches set data server-side for security and performance
 */
export default async function SetDetailsPage({ params }: SetDetailsPageProps) {
  try {
    // Extract setId from params (Next.js 15 uses Promise for params)
    const { setId } = await params
    
    // Fetch set data with cards and products server-side
    const setData = await getSetWithCardsAndProductsServer(setId)
    
    return (
      <AppNavigation>
        {/* Pass server-fetched data to client component for interactivity */}
        <SetDetailClient initialData={setData} setId={setId} />
      </AppNavigation>
    )
  } catch (error) {
    console.error('Error fetching set data in server component:', error)
    // Re-throw to trigger error.tsx boundary
    throw error
  }
}