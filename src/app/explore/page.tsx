import AppNavigation from '@/components/layout/AppNavigation'
import { TCG_GAMES } from '@/constants/tcg-games'
import PageHeader from '@/components/explore/PageHeader'
import GameGrid from '@/components/explore/GameGrid'
import ComingSoonBanner from '@/components/explore/ComingSoonBanner'

export default function ExplorePage() {
  return (
    <AppNavigation>
      <div className="space-y-6">
        <PageHeader 
          title="Explore Trading Cards"
          description="Browse and discover trading cards from various games and sports"
        />
        <GameGrid games={TCG_GAMES} />
        <ComingSoonBanner />
      </div>
    </AppNavigation>
  )
}