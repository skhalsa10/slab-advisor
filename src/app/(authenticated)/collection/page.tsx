import { getUserCollectionCards } from '@/lib/collection-server'
import CollectionClient from './CollectionClient'

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Collection Page - Server Component
 * Fetches user collection data server-side for security and performance
 */
export default async function CollectionPage() {
  try {
    // Fetch collection data server-side with authentication
    const cards = await getUserCollectionCards()
    
    // Pass server-fetched data to client component for interactivity
    return <CollectionClient cards={cards} />
  } catch (error) {
    console.error('Error fetching collection data in server component:', error)
    
    // Re-throw error to be handled by error.tsx
    throw error
  }
}