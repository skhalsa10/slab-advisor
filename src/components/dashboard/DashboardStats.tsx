import StatCard from './StatCard'

interface DashboardStat {
  icon: string
  title: string
  value: string | number
}

interface DashboardStatsProps {
  stats?: DashboardStat[]
}

const defaultStats: DashboardStat[] = [
  {
    icon: '🎴',
    title: 'Total Cards',
    value: 'Coming Soon'
  },
  {
    icon: '💰',
    title: 'Estimated Value',
    value: 'Coming Soon'
  },
  {
    icon: '📊',
    title: 'Cards Analyzed',
    value: 'Coming Soon'
  }
]

export default function DashboardStats({ stats = defaultStats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          icon={stat.icon}
          title={stat.title}
          value={stat.value}
        />
      ))}
    </div>
  )
}