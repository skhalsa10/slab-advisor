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
  variant_pattern?: string // Optional variant pattern (poke_ball, master_ball, etc.)
}

/**
 * Simplified price data structure with variant names as keys
 */
export interface PriceVariants {
  [variantName: string]: number // e.g., { "Normal": 0.07, "Reverse Holofoil": 0.14 }
}

/**
 * Converts technical variant pattern names to user-friendly display names
 * @param variantPattern - The technical pattern name from the database
 * @returns User-friendly display name (sanitized to prevent XSS)
 */
function getFriendlyVariantName(variantPattern: string): string {
  // Sanitize input to prevent XSS attacks
  const sanitizedPattern = variantPattern
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .slice(0, 50) // Limit length to prevent DoS
    .trim()

  const friendlyNames: Record<string, string> = {
    'base': '',
    'poke_ball': '(Poké Ball)',
    'master_ball': '(Master Ball)',
    'great_ball': '(Great Ball)',
    'ultra_ball': '(Ultra Ball)',
    'premier_ball': '(Premier Ball)',
    'reverse': '(Reverse)',
    'first_edition': '(1st Edition)',
    'unlimited': '(Unlimited)',
    'shadowless': '(Shadowless)',
    'error': '(Error)',
    'misprint': '(Misprint)'
  }

  return friendlyNames[sanitizedPattern] || `(${sanitizedPattern})`
}

/**
 * Type guard to validate price variant data structure
 * @param variant - The variant object to validate
 * @returns True if the variant is valid and safe to process
 */
function isValidPriceVariant(variant: unknown): variant is TCGCSVPriceVariant {
  if (variant === null || typeof variant !== 'object') {
    return false
  }

  const obj = variant as Record<string, unknown>

  return (
    'subTypeName' in obj &&
    'marketPrice' in obj &&
    typeof obj.subTypeName === 'string' &&
    typeof obj.marketPrice === 'number' &&
    obj.marketPrice >= 0 &&
    obj.subTypeName.length > 0 &&
    obj.subTypeName.length <= 100 // Prevent excessively long names
  )
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
    let priceArray: unknown[] = []

    if (typeof priceData === 'string') {
      // Validate JSON string size to prevent DoS
      if (priceData.length > 10000) {
        console.debug('Price data string too large, rejecting')
        return null
      }

      // Parse with security against prototype pollution
      const parsed = JSON.parse(priceData, (key, value) => {
        // Prevent prototype pollution attacks
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
          return undefined
        }
        return value
      })

      if (!Array.isArray(parsed)) {
        console.debug('Parsed price data is not an array')
        return null
      }
      priceArray = parsed
    } else if (Array.isArray(priceData)) {
      // Use directly if already an array
      priceArray = priceData
    } else {
      // Unknown format
      return null
    }

    // Limit array size to prevent DoS
    if (priceArray.length > 100) {
      console.debug('Price array too large, truncating')
      priceArray = priceArray.slice(0, 100)
    }

    // Convert to key-value object with validation
    const prices: PriceVariants = {}

    for (const variant of priceArray) {
      if (!isValidPriceVariant(variant)) {
        console.debug('Invalid price variant detected, skipping')
        continue
      }

      // Create unique key that includes variant pattern if available
      const variantPattern = variant.variant_pattern || 'base'
      const friendlyPattern = getFriendlyVariantName(variantPattern)
      const uniqueKey = variantPattern === 'base'
        ? variant.subTypeName
        : `${variant.subTypeName} ${friendlyPattern}`

      prices[uniqueKey] = variant.marketPrice
    }

    // Return null if no valid prices found
    return Object.keys(prices).length > 0 ? prices : null
  } catch (error) {
    // Log detailed error server-side only, minimal info client-side
    if (typeof window === 'undefined') {
      console.error('Price data parsing error:', error)
    } else {
      console.debug('Price data parsing failed')
    }
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

  // Fallback to first available variant with positive price
  const validPrices = Object.entries(prices).filter(([, price]) => price > 0)
  if (validPrices.length > 0) {
    const [, firstPrice] = validPrices[0]
    return `$${firstPrice.toFixed(2)}`
  }

  return null
}

/**
 * Gets smart display price that shows "From $X.XX" for multiple variants
 * @param priceData - The raw JSONB price data from the database
 * @returns Formatted price string with "From" prefix for multiple variants
 */
export function getSmartDisplayPrice(priceData: unknown): {
  price: string | null
  hasMultipleVariants: boolean
  variantCount: number
} {
  const prices = extractMarketPrices(priceData)
  if (!prices) return { price: null, hasMultipleVariants: false, variantCount: 0 }

  const validPrices = Object.entries(prices).filter(([, price]) => price > 0)
  if (validPrices.length === 0) return { price: null, hasMultipleVariants: false, variantCount: 0 }

  const hasMultipleVariants = validPrices.length > 1
  const lowestPrice = Math.min(...validPrices.map(([, price]) => price))

  const priceString = hasMultipleVariants
    ? `From $${lowestPrice.toFixed(2)}`
    : `$${lowestPrice.toFixed(2)}`

  return {
    price: priceString,
    hasMultipleVariants,
    variantCount: validPrices.length
  }
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