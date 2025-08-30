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
    return `${imageUrl}/${quality}.webp`
  }
  
  // Fall back to TCGPlayer image if available
  if (tcgplayerImageUrl) {
    return tcgplayerImageUrl
  }
  
  // Final fallback to placeholder
  return '/card-placeholder.svg'
}

/**
 * Get logo URL with specific format
 * 
 * Generates set logo URLs with format options.
 * Falls back to placeholder if no logo URL provided.
 * 
 * @param logoUrl - Base logo URL from set data
 * @param format - Image format ('png' or 'webp')
 * @returns Complete logo URL with format extension
 * 
 * @example
 * ```typescript
 * const pngLogo = getLogoUrl(set.logo, 'png')
 * const webpLogo = getLogoUrl(set.logo, 'webp')
 * ```
 */
export function getLogoUrl(logoUrl: string | undefined | null, format: 'png' | 'webp' = 'png'): string {
  if (!logoUrl) return '/placeholder-logo.png'
  
  return `${logoUrl}.${format}`
}