import { Settings } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'
import { getUserSettings } from '@/lib/profile-service'
import GradingTipsToggle from '@/components/settings/GradingTipsToggle'

export default async function SettingsPage() {
  // Fetch current user and their settings
  const supabase = await getAuthenticatedSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Defensive check - redirect if no user (shouldn't happen with middleware)
  if (!user) {
    redirect('/auth')
  }

  const userSettings = await getUserSettings(user.id)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <Settings className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-grey-900">Settings</h1>
          <p className="text-grey-600 text-sm">Manage your account settings</p>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-lg border border-grey-200 mb-6">
        <div className="px-4 py-3 border-b border-grey-200">
          <h2 className="text-sm font-semibold text-grey-900">Preferences</h2>
        </div>
        <div className="px-4 divide-y divide-grey-100">
          <GradingTipsToggle initialValue={userSettings.show_grading_tips} />
        </div>
      </div>

      {/* Account Section - Coming Soon */}
      <div className="bg-grey-50 rounded-lg p-6 text-center border border-grey-200">
        <p className="text-grey-600 text-sm">
          Subscription management and billing options coming soon.
        </p>
        <p className="text-grey-500 text-xs mt-2">
          Current plan: <span className="font-medium capitalize">{userSettings.subscription_tier}</span>
        </p>
      </div>
    </div>
  )
}
