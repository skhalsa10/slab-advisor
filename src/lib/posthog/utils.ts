/**
 * PostHog Utility Functions
 *
 * This module provides utility functions for PostHog.
 * Initialization happens in instrumentation-client.ts.
 *
 * Consent is managed via PostHog's native consent system:
 * - posthog.get_explicit_consent_status() returns 'pending' | 'granted' | 'denied'
 * - posthog.opt_in_capturing() grants consent
 * - posthog.opt_out_capturing() denies consent
 *
 * @module posthog/utils
 */

import posthog from 'posthog-js'

/**
 * Handle user granting consent
 * Call this when user clicks "Accept" on consent banner
 *
 * With cookieless_mode: 'on_reject', this enables full tracking:
 * - Cookies and localStorage for persistence
 * - Session recordings
 * - User identification
 */
export function grantConsent(): void {
  posthog.opt_in_capturing()
  posthog.startSessionRecording()
}

/**
 * Handle user denying consent
 * Call this when user clicks "Decline" on consent banner
 *
 * With cookieless_mode: 'on_reject', this triggers cookieless tracking:
 * - Events still captured using privacy-preserving server-side hash
 * - No cookies or localStorage used
 * - Users appear anonymous (daily changing hash)
 * - No session recordings
 */
export function denyConsent(): void {
  posthog.opt_out_capturing()
}

/**
 * Get the current consent status from PostHog
 */
export function getConsentStatus(): 'pending' | 'granted' | 'denied' | undefined {
  if (typeof posthog.get_explicit_consent_status === 'function') {
    return posthog.get_explicit_consent_status()
  }
  return undefined
}

/**
 * Identify a user in PostHog
 * Call this after user logs in
 *
 * Note: identify() only works when consent is granted (not in cookieless mode)
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  posthog.identify(userId, properties)
}

/**
 * Reset user identity in PostHog
 * Call this after user logs out
 */
export function resetUser(): void {
  posthog.reset()
}

/**
 * Check if PostHog is loaded and ready
 */
export function isPostHogReady(): boolean {
  return typeof window !== 'undefined' && posthog.__loaded
}
