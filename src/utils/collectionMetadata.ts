/**
 * Collection Metadata Utilities
 *
 * Provides formatting and display utilities for collection card metadata
 * including variants, conditions, quantities, and grades.
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Professional grading data structure
 */
export interface ProfessionalGradingData {
  company: string
  grade: string | number
  [key: string]: unknown // Allow additional properties
}

/**
 * Variant type definitions and display mappings
 */
export const VARIANT_CONFIG = {
  normal: {
    text: 'Normal',
    abbreviation: 'Normal',
    colorClass: 'bg-grey-500/70',
    listColorClass: 'bg-grey-100 border-grey-300',
    textColor: 'text-white',
    listTextColor: 'text-grey-800'
  },
  holo: {
    text: 'Holo',
    abbreviation: 'Holo',
    colorClass: 'bg-gradient-to-r from-blue-500/70 to-purple-500/70',
    listColorClass: 'bg-blue-100 border-blue-300',
    textColor: 'text-white',
    listTextColor: 'text-blue-800'
  },
  reverse_holo: {
    text: 'Reverse Holo',
    abbreviation: 'Rev Holo',
    colorClass: 'bg-gradient-to-r from-purple-500/70 to-pink-500/70',
    listColorClass: 'bg-purple-100 border-purple-300',
    textColor: 'text-white',
    listTextColor: 'text-purple-800'
  },
  first_edition: {
    text: 'First Edition',
    abbreviation: '1st Ed',
    colorClass: 'bg-gradient-to-r from-yellow-500/70 to-amber-600/70',
    listColorClass: 'bg-amber-100 border-amber-300',
    textColor: 'text-white',
    listTextColor: 'text-amber-800'
  },
  illustration_rare: {
    text: 'Illustration Rare',
    abbreviation: 'Ill Rare',
    colorClass: 'bg-gradient-to-r from-pink-500/70 to-rose-500/70',
    listColorClass: 'bg-pink-100 border-pink-300',
    textColor: 'text-white',
    listTextColor: 'text-pink-800'
  },
  alt_art: {
    text: 'Alt Art',
    abbreviation: 'Alt Art',
    colorClass: 'bg-gradient-to-r from-orange-500/70 to-red-500/70',
    listColorClass: 'bg-orange-100 border-orange-300',
    textColor: 'text-white',
    listTextColor: 'text-orange-800'
  },
  full_art: {
    text: 'Full Art',
    abbreviation: 'Full Art',
    colorClass: 'bg-gradient-to-r from-cyan-500/70 to-blue-500/70',
    listColorClass: 'bg-cyan-100 border-cyan-300',
    textColor: 'text-white',
    listTextColor: 'text-cyan-800'
  },
  secret_rare: {
    text: 'Secret Rare',
    abbreviation: 'Secret',
    colorClass: 'bg-gradient-to-r from-pink-500/70 via-purple-500/70 to-cyan-500/70',
    listColorClass: 'bg-gradient-to-r from-pink-200 to-purple-200 border-purple-300',
    textColor: 'text-white',
    listTextColor: 'text-purple-900'
  }
} as const

/**
 * Default styling for unknown/custom variants
 */
const DEFAULT_VARIANT_STYLE = {
  colorClass: 'bg-grey-600/70',
  listColorClass: 'bg-grey-100 border-grey-300',
  textColor: 'text-white',
  listTextColor: 'text-grey-800'
}

/**
 * Condition definitions and display mappings
 */
export const CONDITION_CONFIG = {
  mint: {
    text: 'Mint',
    abbreviation: 'M',
    colorClass: 'bg-emerald-600/70',
    listColorClass: 'bg-emerald-100 border-emerald-300',
    textColor: 'text-white',
    listTextColor: 'text-emerald-800'
  },
  near_mint: {
    text: 'Near Mint',
    abbreviation: 'NM',
    colorClass: 'bg-green-600/70',
    listColorClass: 'bg-green-100 border-green-300',
    textColor: 'text-white',
    listTextColor: 'text-green-800'
  },
  lightly_played: {
    text: 'Lightly Played',
    abbreviation: 'LP',
    colorClass: 'bg-yellow-500/70',
    listColorClass: 'bg-yellow-100 border-yellow-300',
    textColor: 'text-white',
    listTextColor: 'text-yellow-800'
  },
  moderately_played: {
    text: 'Moderately Played',
    abbreviation: 'MP',
    colorClass: 'bg-orange-500/70',
    listColorClass: 'bg-orange-100 border-orange-300',
    textColor: 'text-white',
    listTextColor: 'text-orange-800'
  },
  heavily_played: {
    text: 'Heavily Played',
    abbreviation: 'HP',
    colorClass: 'bg-red-500/70',
    listColorClass: 'bg-red-100 border-red-300',
    textColor: 'text-white',
    listTextColor: 'text-red-800'
  },
  damaged: {
    text: 'Damaged',
    abbreviation: 'D',
    colorClass: 'bg-red-800/70',
    listColorClass: 'bg-red-200 border-red-400',
    textColor: 'text-white',
    listTextColor: 'text-red-900'
  }
} as const

export type VariantType = keyof typeof VARIANT_CONFIG
export type ConditionType = keyof typeof CONDITION_CONFIG

/**
 * Format variant text for display
 * Converts snake_case to Title Case
 * Sanitizes pattern values with DOMPurify to prevent XSS
 */
function formatVariantText(variant: string, pattern?: string | null): string {
  let baseText = variant
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

  // Add pattern suffix if present (with XSS protection)
  if (pattern) {
    // For known patterns, use friendly labels
    // For unknown patterns, sanitize with DOMPurify as defense-in-depth
    const patternLabel = pattern === 'poke_ball'
      ? 'Poké Ball'
      : pattern === 'master_ball'
        ? 'Master Ball'
        : DOMPurify.sanitize(pattern, { ALLOWED_TAGS: [] }) // Strip all HTML tags
    baseText = `${baseText} (${patternLabel})`
  }

  return baseText
}

/**
 * Create abbreviation from variant text
 * Takes first letter of each word, max 10 chars
 */
function createAbbreviation(text: string): string {
  const words = text.split(/[\s_]+/)
  
  // If single word, return first 8 chars
  if (words.length === 1) {
    return text.substring(0, 8)
  }
  
  // For multiple words, try to create intelligent abbreviation
  if (words.length === 2) {
    // For two words, take more letters from each
    const first = words[0].substring(0, Math.min(4, words[0].length))
    const second = words[1].substring(0, Math.min(4, words[1].length))
    return `${first} ${second}`
  }
  
  // For 3+ words, use initials
  return words
    .map(w => w.charAt(0).toUpperCase())
    .join('')
    .substring(0, 10)
}

/**
 * Format variant for display
 * Handles both known variants and custom/unknown variants
 */
export function formatVariant(
  variant: string | null,
  useAbbreviation = false,
  forListView = false,
  pattern?: string | null
) {
  if (!variant) return null

  // Check if it's a known variant
  const config = VARIANT_CONFIG[variant as VariantType]

  if (config) {
    // Add pattern suffix to text if present
    const text = config.text
    const fullText = pattern ? formatVariantText(variant, pattern) : text
    const displayText = useAbbreviation ? config.abbreviation : fullText

    return {
      text: displayText,
      colorClass: forListView ? config.listColorClass : config.colorClass,
      textColor: forListView ? config.listTextColor : config.textColor,
      abbreviation: config.abbreviation
    }
  }

  // Handle unknown/custom variants
  // Format the text nicely and create an abbreviation
  const formattedText = formatVariantText(variant, pattern)
  const abbreviation = createAbbreviation(formattedText)

  return {
    text: useAbbreviation ? abbreviation : formattedText,
    colorClass: forListView ? DEFAULT_VARIANT_STYLE.listColorClass : DEFAULT_VARIANT_STYLE.colorClass,
    textColor: forListView ? DEFAULT_VARIANT_STYLE.listTextColor : DEFAULT_VARIANT_STYLE.textColor,
    abbreviation: abbreviation
  }
}

/**
 * Format condition for display
 */
export function formatCondition(condition: string | null, useAbbreviation = false, forListView = false) {
  if (!condition) return null
  
  const config = CONDITION_CONFIG[condition as ConditionType]
  if (!config) return null
  
  return {
    text: useAbbreviation ? config.abbreviation : config.text,
    colorClass: forListView ? config.listColorClass : config.colorClass,
    textColor: forListView ? config.listTextColor : config.textColor,
    abbreviation: config.abbreviation
  }
}

/**
 * Format quantity for display
 */
export function formatQuantity(quantity: number | null) {
  if (!quantity || quantity <= 1) {
    return {
      text: '1',
      showBadge: false,
      displayText: ''
    }
  }
  
  return {
    text: quantity.toString(),
    showBadge: true,
    displayText: `×${quantity}`
  }
}

/**
 * Type guard to check if grading data is professional grading data
 */
function isProfessionalGradingData(data: unknown): data is ProfessionalGradingData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'company' in data &&
    'grade' in data &&
    typeof (data as Record<string, unknown>).company === 'string' &&
    (typeof (data as Record<string, unknown>).grade === 'string' || 
     typeof (data as Record<string, unknown>).grade === 'number')
  )
}

/**
 * Format grade for display
 * Handles both estimated grades (1-10) and professional grading data
 */
export function formatGrade(
  estimatedGrade: number | null,
  gradingData?: unknown
) {
  // If professional grading data exists, prioritize it
  if (isProfessionalGradingData(gradingData)) {
    return {
      text: `${gradingData.company} ${gradingData.grade}`,
      shortText: `${gradingData.grade}`,
      isProfessional: true,
      colorClass: 'bg-gradient-to-r from-gold-500/70 to-yellow-600/70',
      textColor: 'text-white'
    }
  }
  
  // Fall back to estimated grade
  if (estimatedGrade !== null && estimatedGrade !== undefined) {
    return {
      text: `${estimatedGrade}/10`,
      shortText: `${estimatedGrade}`,
      isProfessional: false,
      colorClass: 'bg-green-600/70',
      textColor: 'text-white'
    }
  }
  
  return null
}

/**
 * Get badge base classes for consistent styling
 */
export function getBadgeBaseClasses() {
  return 'inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold backdrop-blur-sm shadow-md transition-all'
}

/**
 * Get list badge classes (larger, more readable)
 */
export function getListBadgeClasses() {
  return 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border border-gray-200 shadow-sm'
}