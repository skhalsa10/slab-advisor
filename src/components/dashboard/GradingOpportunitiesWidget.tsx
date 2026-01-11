import { getGradingOpportunities } from '@/lib/grading-opportunities-server'
import { getShowGradingTips } from '@/lib/profile-service'
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'
import WidgetSection from '@/components/widgets/WidgetSection'
import GradingOpportunityList from './GradingOpportunityList'

interface GradingOpportunitiesWidgetProps {
  limit?: number
}

/** Sparkles icon for the widget header */
function SparklesIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  )
}

/**
 * Server component that fetches and displays grading opportunities
 *
 * Shows cards from user's collection with favorable grading economics
 * (SAFE_BET or GAMBLE tiers), sorted by profit potential.
 * Clicking a row opens the grading analysis modal with carousel navigation.
 *
 * Returns null if no opportunities exist (widget not rendered).
 */
export default async function GradingOpportunitiesWidget({
  limit = 3,
}: GradingOpportunitiesWidgetProps) {
  const { opportunities, totalCount } = await getGradingOpportunities(limit)

  // Return null if no opportunities (widget not shown)
  if (opportunities.length === 0) {
    return null
  }

  // Fetch user's grading tips preference
  let showGradingTips = true
  try {
    const supabase = await getAuthenticatedSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      showGradingTips = await getShowGradingTips(user.id)
    }
  } catch {
    // Default to showing tips on error
    showGradingTips = true
  }

  return (
    <WidgetSection
      title="Top Opportunities"
      icon={<SparklesIcon />}
      badgeCount={totalCount}
    >
      <GradingOpportunityList
        opportunities={opportunities}
        totalCount={totalCount}
        showGradingTips={showGradingTips}
      />
    </WidgetSection>
  )
}
