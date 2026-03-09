'use client'

import SettingsToggle from '@/components/ui/SettingsToggle'

interface PreferencesSectionProps {
  initialShowGradingTips: boolean
  initialTheme: 'LIGHT' | 'DARK'
}

export default function PreferencesSection({
  initialShowGradingTips,
  initialTheme,
}: PreferencesSectionProps) {
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

  const handleThemeToggle = async (value: boolean) => {
    const theme = value ? 'DARK' : 'LIGHT'
    const response = await fetch('/api/profile/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })

    if (!response.ok) {
      throw new Error('Failed to update theme preference')
    }
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
        <SettingsToggle
          id="dark-mode"
          label="Dark Mode"
          description="Switch to dark theme"
          initialValue={initialTheme === 'DARK'}
          onToggle={handleThemeToggle}
        />
      </div>
    </div>
  )
}
