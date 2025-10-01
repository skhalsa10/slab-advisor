/**
 * Utility functions for generating external shopping and marketplace links
 */

import type { TCGPlayerGroup } from '@/models/pokemon'

/**
 * Validate that a URL has the expected domain and uses HTTPS
 * @param url - The URL to validate
 * @param expectedDomain - The expected domain (e.g., 'www.tcgplayer.com')
 * @returns True if URL is valid and safe
 */
function validateUrl(url: string, expectedDomain: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname === expectedDomain && urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Generate an eBay search URL for a given search term
 * @param searchTerm - The term to search for (e.g., "Surging Sparks" or "Pikachu VMAX")
 * @returns Formatted eBay search URL
 * @throws Error if search term is invalid
 */
export function getEbaySearchUrl(searchTerm: string): string {
  if (typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
    throw new Error('Invalid search term provided')
  }

  if (searchTerm.length > 500) {
    throw new Error('Search term exceeds maximum length')
  }

  const formattedTerm = searchTerm.replace(/ /g, '+')
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(formattedTerm)}`

  if (!validateUrl(url, 'www.ebay.com')) {
    throw new Error('Generated eBay URL failed validation')
  }

  return url
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

/**
 * Generate a TCGPlayer URL from a group name by slugifying it with enhanced security
 * @param groupName - The group name (e.g., "SWSH11: Lost Origin Trainer Gallery")
 * @returns TCGPlayer URL with slugified name
 * @throws Error if group name is invalid or results in empty slug
 */
export function getTCGPlayerGroupUrl(groupName: string): string {
  // Validate input type and length
  if (typeof groupName !== 'string' || groupName.length === 0) {
    throw new Error('Invalid group name provided')
  }

  if (groupName.length > 200) {
    throw new Error('Group name exceeds maximum length')
  }

  // Enhanced sanitization with Unicode normalization
  const slug = groupName
    .trim()
    .toLowerCase()
    .normalize('NFD') // Handle Unicode normalization
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

  if (slug.length === 0) {
    throw new Error('Group name resulted in empty slug')
  }

  const url = `https://www.tcgplayer.com/categories/trading-and-collectible-card-games/pokemon/${encodeURIComponent(slug)}`

  // Validate the generated URL
  if (!validateUrl(url, 'www.tcgplayer.com')) {
    throw new Error('Generated URL failed validation')
  }

  return url
}

/**
 * Generate button label based on group type
 * @param group - The TCGPlayer group object
 * @param isOnlyGroup - Whether this is the only group (single button case)
 * @returns Button label text
 */
export function getTCGPlayerButtonLabel(group: TCGPlayerGroup, isOnlyGroup: boolean): string {
  if (isOnlyGroup) return "Shop on TCGPlayer"

  // Check if it's a trainer gallery
  if (group.name.includes('Trainer Gallery') || group.abbreviation?.includes('TG')) {
    return "Shop Trainer Gallery"
  }
  return "Shop Main Set"
}

/**
 * Get subtitle text for the button
 * @param group - The TCGPlayer group object
 * @returns Subtitle text (abbreviation or name)
 */
export function getTCGPlayerButtonSubtitle(group: TCGPlayerGroup): string {
  return group.abbreviation || group.name
}