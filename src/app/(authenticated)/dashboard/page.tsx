import PageHeader from '@/components/ui/PageHeader'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentScansWidget from '@/components/dashboard/RecentScansWidget'
import GradingOpportunitiesWidget from '@/components/dashboard/GradingOpportunitiesWidget'
import PortfolioSection from '@/components/dashboard/PortfolioSection'
import { getDashboardStats } from '@/lib/collection-server'
import { getPortfolioSnapshots, getLivePortfolioData } from '@/lib/portfolio-server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    // Fetch data in parallel for better performance
    const [stats, portfolioSnapshots, liveData] = await Promise.all([
      getDashboardStats(),
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
        <PortfolioSection snapshots={portfolioSnapshots} liveData={liveData} />

        {/* Existing dashboard widgets */}
        <DashboardStats stats={stats} />

        <GradingOpportunitiesWidget />

        <RecentScansWidget />
      </div>
    )
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
