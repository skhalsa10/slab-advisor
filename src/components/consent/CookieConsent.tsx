'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'

/**
 * Cookie Consent Banner Component
 *
 * Shows a non-intrusive banner at the bottom of the screen asking
 * users for analytics consent. Uses PostHog's native consent status.
 *
 * Only appears when posthog.get_explicit_consent_status() === 'pending'
 *
 * @see https://posthog.com/tutorials/cookieless-tracking
 */
export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Wait for PostHog to be ready, then check consent status
    const checkConsent = () => {
      if (typeof posthog.get_explicit_consent_status === 'function') {
        const status = posthog.get_explicit_consent_status()
        if (status === 'pending') {
          setShowBanner(true)
          // Animate in after a short delay
          setTimeout(() => setIsVisible(true), 100)
        }
      }
    }

    // PostHog might not be immediately available, retry a few times
    const maxAttempts = 10
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (posthog.__loaded) {
        checkConsent()
        clearInterval(interval)
      } else if (attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const handleAccept = () => {
    posthog.opt_in_capturing()
    posthog.startSessionRecording()
    setIsVisible(false)
    setTimeout(() => setShowBanner(false), 300)
  }

  const handleDecline = () => {
    posthog.opt_out_capturing()
    setIsVisible(false)
    setTimeout(() => setShowBanner(false), 300)
  }

  if (!showBanner) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 pointer-events-none transform transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-4xl p-4">
        <div className="pointer-events-auto rounded-lg border border-border bg-card p-4 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Message */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                We use analytics to understand how you use Slab Advisor and improve your experience.
                {' '}
                <a
                  href="/privacy"
                  className="font-medium text-foreground underline hover:opacity-80"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={handleDecline}
                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
