import { User } from 'lucide-react'
import { redirect } from 'next/navigation'
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'
import {
  getProfileByUserId,
  getUserSettings,
  getCreditDetails,
} from '@/lib/profile-service'
import ProfileSection from '@/components/account/ProfileSection'
import CreditsSection from '@/components/account/CreditsSection'
import SubscriptionSection from '@/components/account/SubscriptionSection'
import PreferencesSection from '@/components/account/PreferencesSection'
import DangerZoneSection from '@/components/account/DangerZoneSection'

export default async function AccountPage() {
  const supabase = await getAuthenticatedSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Defensive check - redirect if no user (shouldn't happen with middleware)
  if (!user) {
    redirect('/auth')
  }

  // Fetch all account data in parallel
  const [profile, userSettings, creditDetails] = await Promise.all([
    getProfileByUserId(user.id),
    getUserSettings(user.id),
    getCreditDetails(user.id),
  ])

  // If no profile, redirect to complete profile
  if (!profile) {
    redirect('/auth/complete-profile')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
          <User className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-grey-900">Account</h1>
          <p className="text-grey-600 text-sm">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Sections */}
      <ProfileSection
        profile={profile}
        email={user.email || ''}
        memberSince={user.created_at || ''}
      />

      <CreditsSection credits={creditDetails} />

      <SubscriptionSection settings={userSettings} />

      <PreferencesSection initialShowGradingTips={userSettings.show_grading_tips} />

      <DangerZoneSection />
    </div>
  )
}
