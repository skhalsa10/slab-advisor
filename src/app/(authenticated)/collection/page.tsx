import {
  getUserCollectionCards,
  getUserCollectionProducts
} from '@/lib/collection-server'
import CollectionClient from './CollectionClient'
import CollectionRefreshProvider from './CollectionRefreshProvider'

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Collection Page - Server Component
 * Fetches user collection data (cards and sealed products) server-side for security and performance
 */
export default async function CollectionPage() {
  try {
    // Fetch collection data server-side with authentication
    // Fetch cards and products in parallel for better performance
    const [cards, products] = await Promise.all([
      getUserCollectionCards(),
      getUserCollectionProducts()
    ])

    // Pass server-fetched data to client component for interactivity
    // Wrap with refresh provider to enable QuickAdd to trigger re-renders
    return (
      <CollectionRefreshProvider>
        <CollectionClient cards={cards} products={products} />
      </CollectionRefreshProvider>
    )
  } catch (error) {
    console.error('Error fetching collection data in server component:', error)

    // Re-throw error to be handled by error.tsx
    throw error
  }
}