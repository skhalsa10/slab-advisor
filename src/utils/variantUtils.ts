/**
 * Utility functions for handling Pokemon card variant patterns
 *
 * Handles the mapping between UI variant selections (like "holo_poke_ball")
 * and database storage (variant + variant_pattern fields)
 */

/**
 * Type for pattern variants that can be stored in the database
 */
export type VariantPattern = 'poke_ball' | 'master_ball' | null

/**
 * Type for UI variant display values
 */
export type UIVariant =
  | 'normal'
  | 'holo'
  | 'reverse_holo'
  | 'first_edition'
  | 'holo_poke_ball'
  | 'holo_master_ball'
  | 'illustration_rare'
  | 'alt_art'
  | 'full_art'
  | 'secret_rare'
  | 'other'

/**
 * Parses a UI variant selection into database fields
 *
 * @param uiVariant - The variant selected in the UI (e.g., "holo_poke_ball")
 * @returns Object with variant and variant_pattern fields for database storage
 *
 * @example
 * parseVariantSelection('holo_poke_ball')
 * // Returns: { variant: 'holo', variant_pattern: 'poke_ball' }
 *
 * parseVariantSelection('normal')
 * // Returns: { variant: 'normal', variant_pattern: null }
 */
export function parseVariantSelection(uiVariant: string): {
  variant: string
  variant_pattern: VariantPattern
} {
  // Pattern variants - split combined variant into base + pattern
  if (uiVariant === 'holo_poke_ball') {
    return { variant: 'holo', variant_pattern: 'poke_ball' }
  }
  if (uiVariant === 'holo_master_ball') {
    return { variant: 'holo', variant_pattern: 'master_ball' }
  }

  // Base variants - no pattern
  return { variant: uiVariant, variant_pattern: null }
}

/**
 * Combines variant and pattern into a UI variant string
 *
 * @param variant - The base variant (e.g., "holo")
 * @param pattern - The pattern variant (e.g., "poke_ball")
 * @returns Combined UI variant string
 *
 * @example
 * combineVariantPattern('holo', 'poke_ball')
 * // Returns: 'holo_poke_ball'
 *
 * combineVariantPattern('normal', null)
 * // Returns: 'normal'
 */
export function combineVariantPattern(
  variant: string,
  pattern: VariantPattern
): string {
  if (!pattern) return variant
  return `${variant}_${pattern}`
}

/**
 * Gets a user-friendly label for a variant
 *
 * @param uiVariant - The UI variant string
 * @returns User-friendly display label
 *
 * @example
 * getVariantLabel('holo_poke_ball')
 * // Returns: 'Holo (Poké Ball)'
 *
 * getVariantLabel('normal')
 * // Returns: 'Normal'
 */
export function getVariantLabel(uiVariant: string): string {
  const variantLabels: Record<string, string> = {
    // Base variants
    'normal': 'Normal',
    'holo': 'Holo',
    'reverse_holo': 'Reverse Holo',
    'first_edition': '1st Edition',
    'illustration_rare': 'Illustration Rare',
    'alt_art': 'Alt Art',
    'full_art': 'Full Art',
    'secret_rare': 'Secret Rare',
    'other': 'Other',

    // Pattern variants
    'holo_poke_ball': 'Holo (Poké Ball)',
    'holo_master_ball': 'Holo (Master Ball)',
  }

  return variantLabels[uiVariant] || uiVariant
}

/**
 * Gets the pattern display name for use in labels
 *
 * @param pattern - The pattern variant
 * @returns Friendly pattern name
 */
export function getPatternLabel(pattern: VariantPattern): string {
  if (!pattern) return ''

  const patternLabels: Record<string, string> = {
    'poke_ball': 'Poké Ball',
    'master_ball': 'Master Ball',
  }

  return patternLabels[pattern] || pattern
}

/**
 * Builds available variant options for a Pokemon card
 *
 * @param card - Card data with variant boolean fields
 * @returns Array of UI variant strings
 *
 * @example
 * buildAvailableVariants({
 *   variant_normal: true,
 *   variant_holo: true,
 *   variant_poke_ball: true,
 *   variant_master_ball: true
 * })
 * // Returns: ['normal', 'holo', 'holo_poke_ball', 'holo_master_ball']
 */
export function buildAvailableVariants(card: {
  variant_normal?: boolean | null
  variant_holo?: boolean | null
  variant_reverse?: boolean | null
  variant_first_edition?: boolean | null
  variant_poke_ball?: boolean | null
  variant_master_ball?: boolean | null
}): string[] {
  const variants: string[] = []

  // Base variants
  if (card.variant_normal) variants.push('normal')
  if (card.variant_holo) variants.push('holo')
  if (card.variant_reverse) variants.push('reverse_holo')
  if (card.variant_first_edition) variants.push('first_edition')

  // Pattern variants (only for holo, based on current data)
  // Only add if both the base variant AND the pattern exist
  if (card.variant_holo && card.variant_poke_ball) {
    variants.push('holo_poke_ball')
  }
  if (card.variant_holo && card.variant_master_ball) {
    variants.push('holo_master_ball')
  }

  return variants.length > 0 ? variants : ['normal']
}
