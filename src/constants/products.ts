/**
 * Product-related constants for Slab Advisor
 *
 * Contains constants for sealed products (booster boxes, theme decks, etc.)
 * as opposed to individual trading cards.
 */

/**
 * Product condition options for sealed products
 * Used in forms for adding/editing products in collection
 */
export const PRODUCT_CONDITION_OPTIONS = [
  { value: 'sealed', label: 'Sealed' },
  { value: 'opened', label: 'Opened' },
  { value: 'damaged', label: 'Damaged' }
] as const

/**
 * Type for product condition values
 */
export type ProductCondition = typeof PRODUCT_CONDITION_OPTIONS[number]['value']

/**
 * Allowed condition values for validation
 */
export const ALLOWED_PRODUCT_CONDITIONS: readonly ProductCondition[] = ['sealed', 'opened', 'damaged'] as const
