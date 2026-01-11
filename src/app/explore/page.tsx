import { Suspense } from 'react'
import AppNavigation from '@/components/layout/AppNavigation'
import PageHeader from '@/components/explore/PageHeader'
import PokemonHeroSection from '@/components/explore/PokemonHeroSection'
import NewestSetsWidget from '@/components/widgets/NewestSetsWidget'
import NewlyReleasedTopCardsWidget from '@/components/widgets/NewlyReleasedTopCardsWidget'
import TopMoversWidget from '@/components/widgets/TopMoversWidget'

// Loading skeletons for widgets
function HeroSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-grey-200 bg-grey-100 h-48 md:h-56" />
  )
}

function WidgetSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-6 w-32 bg-grey-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-grey-200 rounded animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-36 h-48 bg-grey-200 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <AppNavigation>
      <div className="space-y-8">
        <PageHeader
          title="Explore Trading Cards"
          description="Browse and discover cards from your favorite TCGs"
        />

        {/* Pokemon Hero Section */}
        <Suspense fallback={<HeroSkeleton />}>
          <PokemonHeroSection />
        </Suspense>

        {/* Newest Sets Widget */}
        <Suspense fallback={<WidgetSkeleton />}>
          <NewestSetsWidget limit={8} />
        </Suspense>

        {/* Newly Released Top Cards Widget */}
        <Suspense fallback={<WidgetSkeleton />}>
          <NewlyReleasedTopCardsWidget numSets={2} cardsPerSet={5} />
        </Suspense>

        {/* Trending This Week - Top 7-Day Price Movers */}
        <Suspense fallback={<WidgetSkeleton />}>
          <TopMoversWidget limit={10} />
        </Suspense>

        {/* Future TCG note */}
        <p className="text-center text-sm text-grey-500">
          More TCGs coming soon
        </p>
      </div>
    </AppNavigation>
  )
}
