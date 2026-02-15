import PageHeader from '@/components/ui/PageHeader'
import RecentScansWidget from '@/components/dashboard/RecentScansWidget'
import GradingOpportunitiesWidget from '@/components/dashboard/GradingOpportunitiesWidget'
import PortfolioSection from '@/components/dashboard/PortfolioSection'
import TopGemsWidget from '@/components/dashboard/top-gems'
import { getPortfolioSnapshots, getLivePortfolioData } from '@/lib/portfolio-server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    // Fetch data in parallel for better performance
    const [portfolioSnapshots, liveData] = await Promise.all([
      getPortfolioSnapshots(),
      getLivePortfolioData(),
    ])

    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Welcome to Slab Advisor - your AI-powered card grading assistant"
        />

        {/* Portfolio section: KPI row + Chart */}
        <div className="mb-6">
          <PortfolioSection snapshots={portfolioSnapshots} liveData={liveData} />
        </div>

        {/* Bento Box Row: Top Gems (2/3) + Top Opportunities (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <TopGemsWidget />
          </div>
          <div className="lg:col-span-1">
            <GradingOpportunitiesWidget />
          </div>
        </div>

        <RecentScansWidget />
      </div>
    )
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
