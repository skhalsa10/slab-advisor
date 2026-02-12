'use client'

import { useState, useEffect } from 'react'
import SettingsToggle from '@/components/ui/SettingsToggle'
import {
  grantConsent,
  denyConsent,
  getConsentStatus,
  isPostHogReady,
} from '@/lib/posthog/utils'

interface PreferencesSectionProps {
  initialShowGradingTips: boolean
}

export default function PreferencesSection({
  initialShowGradingTips,
}: PreferencesSectionProps) {
  const [consentEnabled, setConsentEnabled] = useState(false)
  const [consentLoaded, setConsentLoaded] = useState(false)

  // Load PostHog consent status on mount
  useEffect(() => {
    const checkConsent = () => {
      if (isPostHogReady()) {
        const status = getConsentStatus()
        setConsentEnabled(status === 'granted')
        setConsentLoaded(true)
      }
    }

    // Check immediately
    checkConsent()

    // Also check after a short delay in case PostHog is still initializing
    const timeout = setTimeout(checkConsent, 500)
    return () => clearTimeout(timeout)
  }, [])

  const handleGradingTipsToggle = async (value: boolean) => {
    const response = await fetch('/api/profile/grading-tips', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ showGradingTips: value }),
    })

    if (!response.ok) {
      throw new Error('Failed to update grading tips preference')
    }
  }

  const handleConsentToggle = async (value: boolean) => {
    if (value) {
      grantConsent()
    } else {
      denyConsent()
    }
    setConsentEnabled(value)
  }

  return (
    <div className="bg-white rounded-lg border border-grey-200 mb-6">
      <div className="px-4 py-3 border-b border-grey-200">
        <h2 className="text-sm font-semibold text-grey-900">Preferences</h2>
      </div>
      <div className="px-4 divide-y divide-grey-100">
        <SettingsToggle
          id="grading-tips"
          label="Show Grading Tips"
          description="Display helpful tips before grading a card"
          initialValue={initialShowGradingTips}
          onToggle={handleGradingTipsToggle}
        />

        {consentLoaded ? (
          <SettingsToggle
            id="analytics-cookies"
            label="Analytics Cookies"
            description="Help improve Slab Advisor with anonymous usage data"
            initialValue={consentEnabled}
            onToggle={handleConsentToggle}
          />
        ) : (
          <div className="flex items-center justify-between py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-grey-900">
                Analytics Cookies
              </p>
              <p className="text-sm text-grey-500 mt-0.5">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
