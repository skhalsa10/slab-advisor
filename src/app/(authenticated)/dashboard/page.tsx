import PageHeader from '@/components/ui/PageHeader'
import DashboardStats from '@/components/dashboard/DashboardStats'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'
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

        <QuickActions />

        <RecentActivity />
      </div>
    )
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    throw error
  }
}
