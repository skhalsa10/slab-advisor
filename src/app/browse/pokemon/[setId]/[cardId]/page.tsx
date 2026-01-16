import { getCardWithSetServer } from '@/lib/pokemon-db-server'
import { getAllCardPrices } from '@/actions/prices'
import AppNavigation from '@/components/layout/AppNavigation'
import CardDetailClient from './CardDetailClient'
import Link from 'next/link'

interface CardDetailsPageProps {
  params: Promise<{
    setId: string
    cardId: string
  }>
}

/**
 * Pokemon Card Detail Page - Server Component
 * Fetches card and set data server-side for security and performance
 */
export default async function CardDetailsPage({ params }: CardDetailsPageProps) {
  try {
    // Extract params from Promise (Next.js 15 requirement)
    const { setId, cardId } = await params
    
    // Fetch card and set data server-side for security
    const { card, set } = await getCardWithSetServer(cardId)

    // Fetch price data at page level for flexibility (includes all variant patterns)
    const { data: priceData } = await getAllCardPrices(cardId)

    return (
      <AppNavigation>
        {/* Pass server-fetched data to client component for interactivity */}
        <CardDetailClient card={card} set={set} setId={setId} priceData={priceData} />
      </AppNavigation>
    )
  } catch (error) {
    console.error('Error fetching card data in server component:', error)
    
    // Extract setId for navigation fallback
    const { setId } = await params
    
    return (
      <AppNavigation>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-grey-900 mb-2">Error Loading Card</h3>
          <p className="text-sm text-grey-600 mb-4">Card not found or failed to load</p>
          <Link
            href={`/browse/pokemon/${setId}`}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Back to Set
          </Link>
        </div>
      </AppNavigation>
    )
  }
}