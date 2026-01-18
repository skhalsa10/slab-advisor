/**
 * SimplePriceDisplay - A simple component for displaying direct numeric prices
 *
 * Used for products where we have a single market price value from
 * pokemon_product_prices.current_market_price instead of parsing TCGCSV format.
 */

interface SimplePriceDisplayProps {
  price: number | null | undefined
  showMarketLabel?: boolean
  className?: string
}

export default function SimplePriceDisplay({
  price,
  showMarketLabel = true,
  className = ''
}: SimplePriceDisplayProps) {
  const formattedPrice = price != null && price > 0 ? `$${price.toFixed(2)}` : null

  return (
    <div className={className}>
      {showMarketLabel && <p className="text-xs text-grey-500">Market price</p>}
      <p className="text-base font-semibold text-grey-900">
        {formattedPrice || 'Not available'}
      </p>
    </div>
  )
}
