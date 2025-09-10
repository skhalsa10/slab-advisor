/**
 * Card-related constants used across the application
 * Shared between collection, browse, and explore features
 */

/**
 * Card condition options for forms and displays
 */
export const CONDITION_OPTIONS = [
  { value: '', label: 'Select Condition' },
  { value: 'mint', label: 'Mint (M)' },
  { value: 'near_mint', label: 'Near Mint (NM)' },
  { value: 'lightly_played', label: 'Lightly Played (LP)' },
  { value: 'moderately_played', label: 'Moderately Played (MP)' },
  { value: 'heavily_played', label: 'Heavily Played (HP)' },
  { value: 'damaged', label: 'Damaged (D)' }
] as const

/**
 * Card variant options
 */
export const VARIANT_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'holo', label: 'Holo' },
  { value: 'reverse_holo', label: 'Reverse Holo' },
  { value: 'first_edition', label: '1st Edition' },
  { value: 'illustration_rare', label: 'Illustration Rare' },
  { value: 'alt_art', label: 'Alt Art' },
  { value: 'full_art', label: 'Full Art' },
  { value: 'secret_rare', label: 'Secret Rare' },
  { value: 'other', label: 'Other' }
] as const

/**
 * Default values for card forms
 */
export const DEFAULT_CARD_VALUES = {
  quantity: 1,
  condition: '',
  variant: 'normal'
} as const

/**
 * Get display label for a condition value
 */
export function getConditionLabel(value: string): string {
  const option = CONDITION_OPTIONS.find(opt => opt.value === value)
  return option?.label || value
}

/**
 * Get display label for a variant value
 */
export function getVariantLabel(value: string): string {
  const option = VARIANT_OPTIONS.find(opt => opt.value === value)
  return option?.label || value
}