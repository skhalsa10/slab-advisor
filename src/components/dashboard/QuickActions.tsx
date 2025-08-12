export default function QuickActions() {
  const actions = [
    'Upload your first card to get AI-powered grading',
    'Build your collection with detailed card information',
    'Track estimated values and condition assessments'
  ]

  return (
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
                {actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}