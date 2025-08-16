/**
 * Utility functions for generating external shopping and marketplace links
 */

/**
 * Generate an eBay search URL for a given search term
 * @param searchTerm - The term to search for (e.g., "Surging Sparks" or "Pikachu VMAX")
 * @returns Formatted eBay search URL
 */
export function getEbaySearchUrl(searchTerm: string): string {
  const formattedTerm = searchTerm.replace(/ /g, '+')
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(formattedTerm)}`
}

/**
 * Generate a TCGPlayer product URL
 * @param productId - The TCGPlayer product ID
 * @returns TCGPlayer product URL
 */
export function getTCGPlayerProductUrl(productId: string | number): string {
  return `https://www.tcgplayer.com/product/${productId}`
}

/**
 * Generate a TCGPlayer search URL
 * @param searchTerm - The term to search for
 * @returns TCGPlayer search URL
 */
export function getTCGPlayerSearchUrl(searchTerm: string): string {
  return `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(searchTerm)}`
}