/**
 * TopGemsWidget Component (Server Component)
 *
 * Displays the user's top 3 most valuable cards as a trophy case.
 * Fetches data server-side and passes to client components for display.
 *
 * Returns null if user has no cards with value.
 */

import { Gem } from 'lucide-react'
import { getTopGems } from '@/lib/top-gems-server'
import WidgetSection from '@/components/widgets/WidgetSection'
import TopGemsList from './TopGemsList'

export default async function TopGemsWidget() {
  const { gems } = await getTopGems()

  // Don't render widget if no valuable cards
  if (gems.length === 0) {
    return null
  }

  return (
    <WidgetSection
      title="Top Gems"
      icon={<Gem className="w-5 h-5" />}
      viewAllHref="/collection"
      viewAllLabel="View Collection"
    >
      <TopGemsList gems={gems} />
    </WidgetSection>
  )
}
