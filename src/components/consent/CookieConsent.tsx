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
      className={`fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-4xl p-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Message */}
            <div className="flex-1">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                We use analytics to understand how you use Slab Advisor and improve your experience.
                {' '}
                <a
                  href="/privacy"
                  className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={handleDecline}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
              >
                Decline
              </button>
              <button
                onClick={handleAccept}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
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
