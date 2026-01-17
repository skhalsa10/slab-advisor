import PageHeader from '@/components/ui/PageHeader'
import RecentScansWidget from '@/components/dashboard/RecentScansWidget'
import GradingOpportunitiesWidget from '@/components/dashboard/GradingOpportunitiesWidget'
import PortfolioSection from '@/components/dashboard/PortfolioSection'
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

        <GradingOpportunitiesWidget />

        <RecentScansWidget />
      </div>
    )
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
