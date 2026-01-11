import PageHeader from '@/components/ui/PageHeader'
import DashboardStats from '@/components/dashboard/DashboardStats'
import RecentScansWidget from '@/components/dashboard/RecentScansWidget'
import GradingOpportunitiesWidget from '@/components/dashboard/GradingOpportunitiesWidget'
import { getDashboardStats } from '@/lib/collection-server'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  try {
    const stats = await getDashboardStats()

    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Welcome to Slab Advisor - your AI-powered card grading assistant"
        />

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
