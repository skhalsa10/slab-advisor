import { formatPrice } from '@/utils/collectionPriceUtils'

interface OwnedVariantPriceDisplayProps {
  price: number
  variant: string
  variantPattern?: string | null
  quantity: number
}

/**
 * Displays a prominent, single-variant price for cards in a collection.
 * Shows the market value of the specific variant the user owns.
 */
export function OwnedVariantPriceDisplay({
  price,
  variant,
  variantPattern,
  quantity,
}: OwnedVariantPriceDisplayProps) {
  const getFriendlyVariantName = (variant: string, pattern?: string | null): string => {
    const baseVariant = variant.charAt(0).toUpperCase() + variant.slice(1)

    if (!pattern || pattern === 'base') {
      return baseVariant
    }

    // Convert pattern to friendly name
    const patternMap: Record<string, string> = {
      'poke_ball': 'Poké Ball',
      'great_ball': 'Great Ball',
      'ultra_ball': 'Ultra Ball',
      'master_ball': 'Master Ball',
    }

    const friendlyPattern = patternMap[pattern] || pattern.replace(/_/g, ' ')
    return `${baseVariant} (${friendlyPattern})`
  }

  const variantDisplay = getFriendlyVariantName(variant, variantPattern)
  const totalValue = price * quantity
  const hasMultiple = quantity > 1

  return (
    <div className="border-t pt-4 mt-4">
      <div
        className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm"
        role="region"
        aria-label="Card market value"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-grey-600 uppercase tracking-wide mb-1">
              Current Market Value
            </p>
            <p
              className="text-3xl font-bold text-green-700 leading-none"
              style={{ letterSpacing: '-0.02em' }}
            >
              {formatPrice(price)}
            </p>
            {hasMultiple && (
              <p className="text-sm text-grey-700 mt-2 font-medium">
                {formatPrice(price)} × {quantity} = {formatPrice(totalValue)}
              </p>
            )}
          </div>

          <div className="text-right ml-4">
            <p className="text-xs font-medium text-grey-500 mb-1">Variant</p>
            <p className="text-sm font-semibold text-grey-900">
              {variantDisplay}
            </p>
          </div>
        </div>

        {hasMultiple && (
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-grey-600">
                Collection Total
              </span>
              <span className="text-lg font-bold text-green-700">
                {formatPrice(totalValue)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
