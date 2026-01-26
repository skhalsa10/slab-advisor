/**
 * Collection Product Utilities
 *
 * Helper functions for working with collection products (sealed products)
 * consistently across the app.
 */

import type { CollectionProduct } from '@/types/database'

/**
 * Extended collection product type that includes joined Pokemon product data
 * This represents the actual shape returned by database queries with joins
 */
export interface CollectionProductWithDetails extends CollectionProduct {
  pokemon_product?: {
    id: number
    name: string
    tcgplayer_image_url: string | null
    tcgplayer_product_id: number
    pokemon_set?: {
      id: string
      name: string
      logo: string | null
    }
  }
  /**
   * Latest price data from pokemon_product_latest_prices view
   * Array because Supabase returns arrays for one-to-many joins
   */
  latest_price?: Array<{
    market_price: number | null
  }>
}

/**
 * Type guard to check if a product has joined Pokemon product data
 */
function hasJoinedProductData(
  product: CollectionProduct
): product is CollectionProductWithDetails {
  return 'pokemon_product' in product && product.pokemon_product !== null
}

/**
 * Gets the display name for a product
 */
export function getProductDisplayName(product: CollectionProduct): string {
  if (hasJoinedProductData(product) && product.pokemon_product?.name) {
    return product.pokemon_product.name
  }

  return 'Unknown Product'
}

/**
 * Gets the set name for a product
 */
export function getProductSetName(product: CollectionProduct): string {
  if (
    hasJoinedProductData(product) &&
    product.pokemon_product?.pokemon_set?.name
  ) {
    return product.pokemon_product.pokemon_set.name
  }

  return 'Unknown Set'
}

/**
 * Gets the image URL for a product
 */
export function getProductImageUrl(product: CollectionProduct): string {
  if (
    hasJoinedProductData(product) &&
    product.pokemon_product?.tcgplayer_image_url
  ) {
    return product.pokemon_product.tcgplayer_image_url
  }

  return '/product-placeholder.svg'
}

/**
 * Gets the current market price for a product
 */
export function getProductMarketPrice(
  product: CollectionProduct
): number | null {
  if (hasJoinedProductData(product) && product.latest_price?.[0]?.market_price) {
    return product.latest_price[0].market_price
  }

  return null
}

/**
 * Gets the total value for a product (quantity * market price)
 */
export function getProductTotalValue(
  product: CollectionProduct
): number | null {
  const price = getProductMarketPrice(product)
  if (price === null) return null

  const quantity = (product as CollectionProductWithDetails).quantity || 1
  return price * quantity
}

/**
 * Calculates the total value of a list of products
 */
export function calculateProductsValue(
  products: CollectionProductWithDetails[]
): number {
  return products.reduce((total, product) => {
    const value = getProductTotalValue(product)
    return total + (value || 0)
  }, 0)
}

/**
 * Formats a product condition for display
 */
export function formatProductCondition(condition: string | null): string {
  if (!condition) return 'Unknown'

  const conditionMap: Record<string, string> = {
    sealed: 'Sealed',
    opened: 'Opened',
    damaged: 'Damaged'
  }

  return conditionMap[condition] || condition
}

/**
 * Gets the condition badge color class
 */
export function getConditionBadgeColor(condition: string | null): string {
  switch (condition) {
    case 'sealed':
      return 'bg-green-100 text-green-800'
    case 'opened':
      return 'bg-blue-100 text-blue-800'
    case 'damaged':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-grey-100 text-grey-800'
  }
}

/**
 * Extended type with 7-day price history for market trend calculations
 */
export interface CollectionProductWithPriceChanges
  extends CollectionProductWithDetails {
  price_7d_ago?: number | null
}

/**
 * Calculates 7-day market trend percentage
 * @returns Percentage change (positive = gain, negative = loss), or null if data unavailable
 */
export function getMarketTrend7d(
  currentPrice: number | null,
  price7dAgo: number | null
): number | null {
  if (currentPrice === null || price7dAgo === null || price7dAgo === 0) {
    return null
  }
  return ((currentPrice - price7dAgo) / price7dAgo) * 100
}

/**
 * Calculates total gain/loss in dollars based on purchase price
 * @returns Dollar gain/loss (positive = gain, negative = loss), or null if purchase_price unavailable
 */
export function getGainLossDollars(
  product: CollectionProductWithDetails
): number | null {
  const marketPrice = getProductMarketPrice(product)
  const purchasePrice = product.purchase_price
  if (marketPrice === null || purchasePrice === null) return null

  const quantity = product.quantity || 1
  return marketPrice * quantity - purchasePrice * quantity
}

/**
 * Calculates gain/loss as percentage based on purchase price
 * @returns Percentage gain/loss, or null if purchase_price unavailable
 */
export function getGainLossPercent(
  product: CollectionProductWithDetails
): number | null {
  const marketPrice = getProductMarketPrice(product)
  const purchasePrice = product.purchase_price
  if (marketPrice === null || purchasePrice === null || purchasePrice === 0) {
    return null
  }

  return ((marketPrice - purchasePrice) / purchasePrice) * 100
}

/**
 * Formats market trend with directional arrow
 * @returns Formatted string like "↗ 12%" or "↘ 4%", or "-" if no data
 */
export function formatMarketTrend(change: number | null): string {
  if (change === null) return '-'
  const arrow = change >= 0 ? '↗' : '↘'
  return `${arrow} ${Math.abs(change).toFixed(0)}%`
}

/**
 * Formats gain/loss with dollar amount and percentage
 * @returns Formatted string like "+$240.00 (+45%)" or "-$50.00 (-12%)", or empty string if no data
 */
export function formatGainLoss(
  dollars: number | null,
  percent: number | null
): string {
  if (dollars === null || percent === null) return ''
  const sign = dollars >= 0 ? '+' : '-'
  const percentSign = percent >= 0 ? '+' : '-'
  return `${sign}$${Math.abs(dollars).toFixed(2)} (${percentSign}${Math.abs(percent).toFixed(0)}%)`
}

/**
 * Gets the appropriate color class for gain/loss values
 * @returns Tailwind color class for positive (green), negative (red), or neutral (grey)
 */
export function getGainLossColor(value: number | null): string {
  if (value === null) return 'text-grey-400'
  return value >= 0 ? 'text-green-600' : 'text-red-600'
}
