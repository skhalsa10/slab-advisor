import { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  unit?: string
  className?: string
}

export default function StatCard({ icon, label, value, unit, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow-sm rounded-2xl ${className}`}>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-grey-500 font-medium">
              {label}
            </p>
            <p className="text-2xl font-semibold text-grey-900 mt-0.5">
              {value}{unit && <span className="ml-1">{unit}</span>}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4 text-grey-400">
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}
