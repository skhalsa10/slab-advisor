interface StatCardProps {
  icon: string
  title: string
  value: string | number
  className?: string
}

export default function StatCard({ icon, title, value, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-grey-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-grey-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}