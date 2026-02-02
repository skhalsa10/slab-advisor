/**
 * Waitlist Mode Utilities
 *
 * Provides helpers for waitlist gating, including:
 * - Mode detection (waitlist vs open)
 * - HMAC-based bypass token generation and validation (Edge Runtime compatible)
 *
 * The bypass token is an HMAC signature derived from WAITLIST_BYPASS_SECRET.
 * This prevents cookie forgery — someone cannot manually set the cookie
 * without knowing the server-side secret.
 */

/** Cookie name used for the waitlist bypass */
export const BYPASS_COOKIE_NAME = 'waitlist_bypass'

/** Cookie max age in seconds (1 day) */
export const BYPASS_COOKIE_MAX_AGE = 60 * 60 * 24

/**
 * Check if the application is in waitlist mode
 */
export function isWaitlistMode(): boolean {
  return process.env.NEXT_PUBLIC_LAUNCH_MODE === 'waitlist'
}

/**
 * Generate an HMAC-based bypass token using Web Crypto API (Edge Runtime compatible).
 * The token is deterministic for a given secret, so it can be validated later.
 */
export async function generateBypassToken(): Promise<string> {
  const secret = process.env.WAITLIST_BYPASS_SECRET
  if (!secret) {
    throw new Error('WAITLIST_BYPASS_SECRET is not configured')
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode('waitlist_bypass_valid')
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Validate a bypass cookie value against the expected HMAC token.
 * Returns false if the secret is not configured or the token doesn't match.
 */
export async function validateBypassToken(cookieValue: string): Promise<boolean> {
  try {
    const expected = await generateBypassToken()
    return cookieValue === expected
  } catch {
    return false
  }
}
