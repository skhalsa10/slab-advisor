'use client'

import SettingsToggle from './SettingsToggle'

interface GradingTipsToggleProps {
  initialValue: boolean
}

export default function GradingTipsToggle({ initialValue }: GradingTipsToggleProps) {
  const handleToggle = async (value: boolean) => {
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
    <SettingsToggle
      id="show-grading-tips"
      label="Show grading tips"
      description="Display photography tips before grading a card"
      initialValue={initialValue}
      onToggle={handleToggle}
    />
  )
}
