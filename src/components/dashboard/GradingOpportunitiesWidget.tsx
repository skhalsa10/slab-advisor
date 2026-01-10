import { getGradingOpportunities } from '@/lib/grading-opportunities-server'
import WidgetSection from '@/components/widgets/WidgetSection'
import GradingOpportunityList from './GradingOpportunityList'

interface GradingOpportunitiesWidgetProps {
  limit?: number
}

/**
 * Server component that fetches and displays grading opportunities
 *
 * Shows cards from user's collection with favorable grading economics
 * (SAFE_BET or GAMBLE tiers), sorted by profit potential.
 * Clicking a row opens the grading analysis modal.
 *
 * Returns null if no opportunities exist (widget not rendered).
 */
export default async function GradingOpportunitiesWidget({
  limit = 5,
}: GradingOpportunitiesWidgetProps) {
  const { opportunities } = await getGradingOpportunities(limit)

  // Return null if no opportunities (widget not shown)
  if (opportunities.length === 0) {
    return null
  }

  return (
    <WidgetSection title="Grading Opportunities">
      <GradingOpportunityList opportunities={opportunities} />
    </WidgetSection>
  )
}
