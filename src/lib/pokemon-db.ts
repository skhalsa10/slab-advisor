/**
 * Pokemon Database module for Slab Advisor
 * 
 * This module provides utility functions for Pokemon TCG data.
 * It contains helper functions for image URL generation and formatting.
 * 
 * Key features:
 * - Image URL handling with quality options
 * - Logo URL formatting
 * 
 * @module pokemon-db
 */

/**
 * Get image URL with specific quality
 * 
 * Generates card image URLs with quality options.
 * Falls back to TCGPlayer image, then placeholder if no image URL provided.
 * 
 * @param imageUrl - Base image URL from card data (TCGdx)
 * @param quality - Image quality ('low' or 'high') - only applies to TCGdx images
 * @param tcgplayerImageUrl - Fallback TCGPlayer image URL
 * @returns Complete image URL with quality suffix or fallback
 * 
 * @example
 * ```typescript
 * const lowRes = getCardImageUrl(card.image, 'low', card.tcgplayer_image_url)
 * const highRes = getCardImageUrl(card.image, 'high', card.tcgplayer_image_url)
 * ```
 */
export function getCardImageUrl(
  imageUrl: string | undefined | null, 
  quality: 'low' | 'high' = 'low',
  tcgplayerImageUrl?: string | null
): string {
  // First try TCGdx image with quality
  if (imageUrl) {
    return `${imageUrl}/${quality}.jpg`
  }
  
  // Fall back to TCGPlayer image if available
  if (tcgplayerImageUrl) {
    return tcgplayerImageUrl
  }
  
  // Final fallback to placeholder
  return '/card-placeholder.svg'
}

/**
 * Check if URL already has an image file extension
 *
 * @param url - URL to check
 * @returns true if URL ends with a common image extension
 */
function hasImageExtension(url: string): boolean {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.ico', '.tiff', '.avif']
  const lowerUrl = url.toLowerCase()
  return imageExtensions.some(ext => lowerUrl.endsWith(ext))
}

/**
 * Get logo URL with specific format
 *
 * Generates set logo URLs with format options.
 * Checks primary logo first, then secondary logo, then falls back to placeholder.
 *
 * @param logoUrl - Base logo URL from set data
 * @param secondaryLogoUrl - Secondary logo URL from set data (optional fallback)
 * @param format - Image format ('png' or 'webp')
 * @returns Complete logo URL with format extension
 *
 * @example
 * ```typescript
 * const pngLogo = getLogoUrl(set.logo, set.secondary_logo, 'png')
 * const webpLogo = getLogoUrl(set.logo, set.secondary_logo, 'webp')
 * ```
 */
export function getLogoUrl(
  logoUrl: string | undefined | null,
  secondaryLogoUrl?: string | undefined | null,
  format: 'png' | 'webp' = 'png'
): string {
  // Try primary logo first
  if (logoUrl) {
    return `${logoUrl}.${format}`
  }

  // Fall back to secondary logo if available
  if (secondaryLogoUrl) {
    // Check if secondary logo already has an image extension
    if (hasImageExtension(secondaryLogoUrl)) {
      return secondaryLogoUrl
    }
    return `${secondaryLogoUrl}.${format}`
  }

  // Final fallback to placeholder
  return '/placeholder-logo.png'
}