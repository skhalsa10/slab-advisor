import type { UserSettings } from '@/lib/profile-service'

interface SubscriptionSectionProps {
  settings: UserSettings
}

export default function SubscriptionSection({
  settings,
}: SubscriptionSectionProps) {
  const isBasic = settings.subscription_tier === 'free'

  return (
    <div className="bg-white rounded-lg border border-grey-200 mb-6">
      <div className="px-4 py-3 border-b border-grey-200">
        <h2 className="text-sm font-semibold text-grey-900">Subscription</h2>
      </div>
      <div className="p-4">
        {/* Tier badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isBasic
                ? 'bg-grey-100 text-grey-800'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {isBasic ? 'Basic' : 'Pro'}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-grey-600 mb-4">
          {isBasic
            ? 'Purchase credits as needed'
            : '10 credits per month included'}
        </p>

        {/* Upgrade button (placeholder) */}
        {isBasic && (
          <>
            <button
              disabled
              className="w-full px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              Upgrade to Pro
            </button>
            <p className="text-xs text-grey-500 text-center mt-2">
              Get 10 credits/month + perks - Coming soon
            </p>
          </>
        )}

        {/* Manage subscription for Pro users (future) */}
        {!isBasic && (
          <button
            disabled
            className="w-full px-4 py-2 border border-grey-300 text-grey-700 text-sm font-medium rounded-md opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            Manage Subscription
          </button>
        )}
      </div>
    </div>
  )
}
