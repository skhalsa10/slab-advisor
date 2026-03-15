'use client'

import SettingsToggle from '@/components/ui/SettingsToggle'
import { useTheme } from '@/contexts/ThemeContext'

interface PreferencesSectionProps {
  initialShowGradingTips: boolean
}

export default function PreferencesSection({
  initialShowGradingTips,
}: PreferencesSectionProps) {
  const { theme, toggleTheme } = useTheme()
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

  return (
    <div className="bg-card rounded-lg border border-border mb-6">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-card-foreground">Preferences</h2>
      </div>
      <div className="px-4 divide-y divide-border/50">
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
          initialValue={theme === 'DARK'}
          onToggle={() => toggleTheme()}
        />
      </div>
    </div>
  )
}
