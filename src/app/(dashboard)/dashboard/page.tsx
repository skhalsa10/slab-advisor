import { useCredits } from '@/contexts/CreditsContext'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-grey-900">Dashboard</h1>
        <p className="mt-1 text-sm text-grey-600">
          Welcome to Slab Advisor - your AI-powered card grading assistant
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Collection Stats */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🎴</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-grey-500 truncate">
                    Total Cards
                  </dt>
                  <dd className="text-lg font-medium text-grey-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Value */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">💰</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-grey-500 truncate">
                    Estimated Value
                  </dt>
                  <dd className="text-lg font-medium text-grey-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-grey-500 truncate">
                    Cards Analyzed
                  </dt>
                  <dd className="text-lg font-medium text-grey-900">
                    Coming Soon
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-grey-900">
            Quick Actions
          </h3>
          <div className="mt-5">
            <div className="rounded-md bg-orange-50 p-4">
              <div className="text-sm text-orange-700">
                <p className="font-medium">Get started with Slab Advisor:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>Upload your first card to get AI-powered grading</li>
                  <li>Build your collection with detailed card information</li>
                  <li>Track estimated values and condition assessments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for future widgets */}
      <div className="bg-white shadow rounded-lg">
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
    </div>
  )
}