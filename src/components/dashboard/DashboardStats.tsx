import StatCard from './StatCard'
import { type DashboardStats } from '@/types/database'

interface DashboardStatsProps {
  stats: DashboardStats
}

// Stack/layers icon (similar to reference design)
function StackIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 12 5.25l5.571 4.5M6.429 14.25 12 18.75l5.571-4.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 12 17.25 21.75 12" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.5 12 12.75 21.75 7.5 12 2.25 2.25 7.5Z" />
    </svg>
  )
}

// Dollar/currency icon
function CurrencyIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

// Chart/analytics icon
function ChartIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={<StackIcon />}
        label="Total Items"
        value={stats.totalCards.toLocaleString()}
        unit="Cards"
      />
      <StatCard
        icon={<CurrencyIcon />}
        label="Estimated Value"
        value={stats.estimatedValue !== null ? `$${stats.estimatedValue.toLocaleString()}` : 'Coming Soon'}
      />
      <StatCard
        icon={<ChartIcon />}
        label="Cards Analyzed"
        value={stats.cardsAnalyzed !== null ? stats.cardsAnalyzed.toLocaleString() : 'Coming Soon'}
      />
    </div>
  )
}
