interface RecentActivityProps {
  className?: string
}

export default function RecentActivity({ className = '' }: RecentActivityProps) {
  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-grey-900">
          Recent Activity
        </h3>
        <div className="mt-5">
          <p className="text-sm text-grey-500">
            Your recent card uploads and analysis results will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}