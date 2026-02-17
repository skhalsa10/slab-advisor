import {
  getUserCollectionCards,
  getUserCollectionProducts,
  getUserBinders,
  getUserBinderCards
} from '@/lib/collection-server'
import CollectionClient from './CollectionClient'
import CollectionRefreshProvider from './CollectionRefreshProvider'

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic'

/**
 * Collection Page - Server Component
 * Fetches user collection data (cards, sealed products, binders) server-side for security and performance
 */
export default async function CollectionPage() {
  try {
    // Fetch all collection data server-side with authentication in parallel
    const [cards, products, binders, binderCards] = await Promise.all([
      getUserCollectionCards(),
      getUserCollectionProducts(),
      getUserBinders(),
      getUserBinderCards()
    ])

    // Pass server-fetched data to client component for interactivity
    // Wrap with refresh provider to enable QuickAdd to trigger re-renders
    return (
      <CollectionRefreshProvider>
        <CollectionClient
          cards={cards}
          products={products}
          binders={binders}
          binderCards={binderCards}
        />
      </CollectionRefreshProvider>
    )
  } catch (error) {
    console.error('Error fetching collection data in server component:', error)

    // Re-throw error to be handled by error.tsx
    throw error
  }
}