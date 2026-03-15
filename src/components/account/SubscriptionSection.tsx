import type { UserSettings } from '@/lib/profile-service'

interface SubscriptionSectionProps {
  settings: UserSettings
}

export default function SubscriptionSection({
  settings,
}: SubscriptionSectionProps) {
  const isBasic = settings.subscription_tier === 'free'

  return (
    <div className="bg-card rounded-lg border border-border mb-6">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-card-foreground">Subscription</h2>
      </div>
      <div className="p-4">
        {/* Tier badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isBasic
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-orange-100 text-orange-800'
            }`}
          >
            {isBasic ? 'Basic' : 'Pro'}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          {isBasic
            ? 'Purchase credits as needed'
            : '10 credits per month included'}
        </p>

        {/* Upgrade button (placeholder) */}
        {isBasic && (
          <>
            <button
              disabled
              className="w-full px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md opacity-50 cursor-not-allowed"
              title="Coming soon"
            >
              Upgrade to Pro
            </button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Get 10 credits/month + perks - Coming soon
            </p>
          </>
        )}

        {/* Manage subscription for Pro users (future) */}
        {!isBasic && (
          <button
            disabled
            className="w-full px-4 py-2 border border-border/60 text-muted-foreground text-sm font-medium rounded-md opacity-50 cursor-not-allowed"
            title="Coming soon"
          >
            Manage Subscription
          </button>
        )}
      </div>
    </div>
  )
}
