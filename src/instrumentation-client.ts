/**
 * PostHog Client Instrumentation for Next.js 15.3+
 *
 * This file initializes PostHog on the client side.
 * It runs automatically when the client loads.
 *
 * GDPR Compliance using cookieless_mode: 'on_reject':
 * - Events wait until consent decision is made
 * - If user accepts → full tracking with cookies
 * - If user declines → cookieless tracking (privacy-preserving server-side hash)
 *
 * Consent is managed via PostHog's native consent system:
 * - posthog.get_explicit_consent_status() returns 'pending', 'granted', or 'denied'
 * - posthog.opt_in_capturing() grants consent
 * - posthog.opt_out_capturing() denies consent (triggers cookieless mode)
 *
 * @see https://posthog.com/tutorials/cookieless-tracking
 */

import posthog from 'posthog-js'

// Only initialize in browser with valid API key
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',

    // Use PostHog's recommended defaults for 2025
    defaults: '2025-11-30',

    // GDPR: Use cookieless mode when consent is rejected
    // - 'on_reject': Full tracking if consented, cookieless if rejected
    // - Events wait until consent decision before capturing
    cookieless_mode: 'on_reject',

    // Session recording privacy settings
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: 'input[type="password"], input[type="email"], [data-ph-no-capture]',
    },

    // Debug mode in development
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') {
        ph.debug()
      }
    },
  })
}
