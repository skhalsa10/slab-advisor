import {
  getEbaySearchUrl,
  getTCGPlayerGroupUrl
} from '@/utils/external-links'
import type { TCGPlayerGroup } from '@/models/pokemon'

interface ShopTheSetProps {
  tcgPlayerUrl?: string
  tcgPlayerGroups?: TCGPlayerGroup[]
  setName: string
}

export default function ShopTheSet({ tcgPlayerUrl, tcgPlayerGroups, setName }: ShopTheSetProps) {
  // Safely generate eBay URL with error handling
  let ebayUrl: string
  try {
    ebayUrl = getEbaySearchUrl(setName)
  } catch (error) {
    console.error('Failed to generate eBay URL:', error)
    ebayUrl = 'https://www.ebay.com' // Fallback to eBay homepage
  }

  // Determine which TCGPlayer options to show
  const shouldUseTCGPlayerGroups = tcgPlayerGroups && tcgPlayerGroups.length > 0

  // Primary button styling (main actions)
  const primaryButtonClass = "w-full inline-flex items-center justify-center px-4 py-2.5 bg-white border-2 border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"

  // Secondary button styling (supplemental options)
  const secondaryButtonClass = "w-full inline-flex items-center justify-center px-4 py-2.5 bg-white border border-orange-600 text-orange-600 text-sm font-medium rounded-md hover:bg-orange-50 transition-colors"

  return (
    <div>
      <h3 className="text-lg font-semibold text-grey-900 mb-4">Shop the set</h3>

      <div className="flex flex-col gap-3">
        {/* TCGPlayer Options */}
        {shouldUseTCGPlayerGroups ? (
          // Multiple groups - show all buttons directly
          <>
            {tcgPlayerGroups.map((group, index) => {
              // Safely generate TCGPlayer URL with error handling
              let groupUrl: string
              try {
                groupUrl = getTCGPlayerGroupUrl(group.name)
              } catch (error) {
                console.error(`Failed to generate TCGPlayer URL for group ${group.groupId}:`, error)
                return null // Skip this group if URL generation fails
              }

              const isTrainerGallery = group.name.includes('Trainer Gallery')
              const buttonLabel = isTrainerGallery
                ? 'Shop Trainer Gallery on TCGPlayer'
                : 'Shop on TCGPlayer'
              const buttonClass = index === 0 ? primaryButtonClass : secondaryButtonClass

              return (
                <a
                  key={group.groupId}
                  href={groupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass}
                  aria-label={`${buttonLabel} - ${group.name}, opens in new tab`}
                >
                  {buttonLabel}
                </a>
              )
            }).filter(Boolean)}
          </>
        ) : (
          // Single group or legacy URL fallback
          tcgPlayerUrl && (
            <a
              href={tcgPlayerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButtonClass}
              aria-label={`Shop ${setName} on TCGPlayer, opens in new tab`}
            >
              Shop on TCGPlayer
            </a>
          )
        )}

        {/* eBay Option */}
        <a
          href={ebayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryButtonClass}
          aria-label={`Shop ${setName} on eBay, opens in new tab`}
        >
          Shop on eBay
        </a>
      </div>

      <p className="text-xs text-grey-500 mt-3 text-center">Shopping links may contain affiliate links</p>
    </div>
  )
}