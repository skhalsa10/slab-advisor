import { getEbaySearchUrl } from '@/utils/external-links'

interface ShopTheSetProps {
  tcgPlayerUrl?: string
  setName: string
}

export default function ShopTheSet({ tcgPlayerUrl, setName }: ShopTheSetProps) {
  const ebayUrl = getEbaySearchUrl(setName)
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-grey-900 mb-2">Shop the set</h3>
      <p className="text-xs text-grey-500 mb-4">Shopping links may contain affiliate links</p>
      
      <div className="flex flex-col gap-3">
        {tcgPlayerUrl && (
          <a
            href={tcgPlayerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-white border-2 border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"
          >
            Shop on TCGPlayer
            <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
        
        <a
          href={ebayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-white border-2 border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"
        >
          Shop on eBay
          <svg className="ml-2 -mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}