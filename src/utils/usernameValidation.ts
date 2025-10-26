/**
 * Username Validation Utilities
 *
 * Client-side validation for usernames (backup to database validation)
 * Security: Input validation, reserved words, format enforcement
 */

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

// Reserved usernames that cannot be used (expanded for security)
export const RESERVED_USERNAMES = [
  // System accounts
  'admin',
  'root',
  'support',
  'api',
  'www',
  'app',
  'mail',
  'help',
  'ftp',
  'blog',
  'shop',
  'store',
  'administrator',
  'mod',
  'moderator',
  'owner',
  'staff',
  'team',
  'official',
  'verified',
  'system',
  'bot',
  'null',
  'undefined',
  'none',
  'anonymous',
  'guest',
  'test',
  'demo',
  'example',
  'sample',

  // Application routes
  'about',
  'terms',
  'privacy',
  'contact',
  'dashboard',
  'collection',
  'browse',
  'search',
  'login',
  'signup',
  'auth',
  'account',
  'settings',
  'profile',
  'user',
  'explore',
  'discover',
  'trending',
  'popular',

  // Application-specific
  'slabadvisor',
  'slab',
  'advisor',
  'cards',
  'card',
  'grade',
  'grading',
  'pricing',
  'marketplace',
  'market',

  // Security-related
  'security',
  'abuse',
  'phishing',
  'scam',
  'fraud',
  'report',
  'verify',
  'confirm',
  'reset',
  'recover',

  // Future features
  'public',
  'private',
  'pro',
  'premium',
  'subscription',
  'billing',
  'payment',
  'checkout',
  'cart',
]

export interface UsernameValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates username format on client side
 *
 * Rules:
 * - 3-30 characters
 * - Alphanumeric + underscore only
 * - Must start and end with alphanumeric (not underscore)
 * - Not a reserved word
 */
export function validateUsernameFormat(
  username: string
): UsernameValidationResult {
  if (!username) {
    return { valid: false, error: 'Username is required' }
  }

  // Trim whitespace
  const trimmed = username.trim()

  // Check length
  if (trimmed.length < USERNAME_MIN_LENGTH) {
    return {
      valid: false,
      error: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    }
  }

  if (trimmed.length > USERNAME_MAX_LENGTH) {
    return {
      valid: false,
      error: `Username must be no more than ${USERNAME_MAX_LENGTH} characters`,
    }
  }

  // Check format: alphanumeric + underscore, start/end with alphanumeric
  const regex = /^[a-zA-Z0-9][a-zA-Z0-9_]*[a-zA-Z0-9]$/
  if (!regex.test(trimmed)) {
    return {
      valid: false,
      error:
        'Username can only contain letters, numbers, and underscores. Must start and end with a letter or number.',
    }
  }

  // Check for reserved usernames (case-insensitive)
  if (RESERVED_USERNAMES.includes(trimmed.toLowerCase())) {
    return { valid: false, error: 'This username is reserved' }
  }

  return { valid: true }
}

/**
 * Suggests a username from an email address
 *
 * Example: john.doe+tag@example.com → john_doe
 */
export function suggestUsernameFromEmail(email: string): string {
  // Extract local part before @
  const localPart = email.split('@')[0]

  // Remove everything after + (email tags)
  const withoutTags = localPart.split('+')[0]

  // Replace non-alphanumeric characters (except underscore) with underscore
  let suggested = withoutTags.replace(/[^a-zA-Z0-9_]/g, '_')

  // Remove leading/trailing underscores and multiple consecutive underscores
  suggested = suggested.replace(/^_+|_+$/g, '')
  suggested = suggested.replace(/_+/g, '_')

  // Ensure starts with alphanumeric
  suggested = suggested.replace(/^_+/, '')

  // Ensure ends with alphanumeric
  suggested = suggested.replace(/_+$/, '')

  // Lowercase
  suggested = suggested.toLowerCase()

  // Ensure minimum length (pad with numbers if needed)
  if (suggested.length < USERNAME_MIN_LENGTH) {
    const randomNum = Math.floor(Math.random() * 1000)
    suggested = suggested + randomNum
  }

  // Ensure maximum length
  if (suggested.length > USERNAME_MAX_LENGTH) {
    suggested = suggested.substring(0, USERNAME_MAX_LENGTH)
  }

  // Final check: ensure ends with alphanumeric
  if (suggested.endsWith('_')) {
    suggested = suggested.slice(0, -1) + '1'
  }

  return suggested
}
