import { getSetWithCardsAndProductsServer } from '@/lib/pokemon-db-server'
import { getUserBinders } from '@/lib/collection-server'
import SetDetailClient from './SetDetailClient'
import type { Binder } from '@/types/database'

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

    // Fetch user's binders (graceful fallback if not authenticated)
    let binders: Binder[] = []
    try {
      binders = await getUserBinders()
    } catch {
      binders = []
    }

    return (
      <SetDetailClient initialData={setData} setId={setId} binders={binders} />
    )
  } catch (error) {
    console.error('Error fetching set data in server component:', error)
    // Re-throw to trigger error.tsx boundary
    throw error
  }
}
