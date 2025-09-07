/**
 * Utility functions for handling price data from TCGCSV
 */

/**
 * TCGCSV price data structure for a single variant
 */
interface TCGCSVPriceVariant {
  productId: number
  lowPrice: number
  midPrice: number
  highPrice: number
  marketPrice: number
  directLowPrice: number
  subTypeName: string
}

/**
 * Simplified price data structure with variant names as keys
 */
export interface PriceVariants {
  [variantName: string]: number // e.g., { "Normal": 0.07, "Reverse Holofoil": 0.14 }
}

/**
 * Extracts market prices from TCGCSV price data and returns a simple key-value object
 * @param priceData - The raw JSONB price data from the database
 * @returns Object with variant names as keys and market prices as values, or null if no valid data
 * 
 * @example
 * Input: [
 *   { "subTypeName": "Normal", "marketPrice": 0.07, ... },
 *   { "subTypeName": "Reverse Holofoil", "marketPrice": 0.14, ... }
 * ]
 * Output: { "Normal": 0.07, "Reverse Holofoil": 0.14 }
 */
export function extractMarketPrices(priceData: unknown): PriceVariants | null {
  if (!priceData) return null
  
  try {
    // Handle both array format and potential string format from database
    let priceArray: TCGCSVPriceVariant[] = []
    
    if (typeof priceData === 'string') {
      // Parse if it's a JSON string
      priceArray = JSON.parse(priceData)
    } else if (Array.isArray(priceData)) {
      // Use directly if already an array
      priceArray = priceData
    } else {
      // Unknown format
      return null
    }
    
    // Convert to key-value object
    const prices: PriceVariants = {}
    
    for (const variant of priceArray) {
      if (variant.subTypeName && typeof variant.marketPrice === 'number') {
        prices[variant.subTypeName] = variant.marketPrice
      }
    }
    
    // Return null if no valid prices found
    return Object.keys(prices).length > 0 ? prices : null
  } catch (error) {
    console.debug('Error parsing TCGCSV price data:', error)
    return null
  }
}

/**
 * Gets the display price from price variants, preferring Normal variant
 * @param prices - The price variants object
 * @returns Formatted price string (e.g., "$0.07") or null if no price
 */
export function getDisplayPrice(prices: PriceVariants | null): string | null {
  if (!prices) return null
  
  // Prefer Normal variant
  if (prices['Normal'] && prices['Normal'] > 0) {
    return `$${prices['Normal'].toFixed(2)}`
  }
  
  // Fallback to first available variant
  const firstPrice = Object.values(prices)[0]
  if (firstPrice && firstPrice > 0) {
    return `$${firstPrice.toFixed(2)}`
  }
  
  return null
}

/**
 * Gets the best available price (lowest) from all variants
 * @param prices - The price variants object
 * @returns The lowest price or null if no prices
 */
export function getBestPrice(prices: PriceVariants | null): number | null {
  if (!prices) return null
  
  const validPrices = Object.values(prices).filter(price => price > 0)
  return validPrices.length > 0 ? Math.min(...validPrices) : null
}

/**
 * Gets the price for a specific variant
 * @param prices - The price variants object
 * @param variantName - The name of the variant (e.g., "Normal", "Reverse Holofoil")
 * @returns The price for the variant or null if not found
 */
export function getVariantPrice(prices: PriceVariants | null, variantName: string): number | null {
  if (!prices || !prices[variantName]) return null
  return prices[variantName] > 0 ? prices[variantName] : null
}