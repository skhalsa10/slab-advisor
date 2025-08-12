import PageHeader from '@/components/ui/PageHeader'
import DashboardStats from '@/components/dashboard/DashboardStats'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentActivity from '@/components/dashboard/RecentActivity'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard"
        description="Welcome to Slab Advisor - your AI-powered card grading assistant"
      />
      
      <DashboardStats />
      
      <QuickActions />
      
      <RecentActivity />
    </div>
  )
}