'use client'

import { Sparkles } from 'lucide-react'
import type { CreditDetails } from '@/lib/profile-service'

interface CreditsSectionProps {
  credits: CreditDetails
}

export default function CreditsSection({ credits }: CreditsSectionProps) {
  return (
    <div className="bg-card rounded-lg border border-border mb-6">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-card-foreground">Credits</h2>
      </div>
      <div className="p-4">
        {/* Total credits display */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-orange-600" />
          <span className="text-3xl font-bold text-card-foreground">
            {credits.credits_remaining}
          </span>
          <span className="text-sm text-muted-foreground">credits remaining</span>
        </div>

        {/* Breakdown */}
        <div className="bg-card/50 rounded-lg p-3 mb-4 border border-secondary">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Subscription</span>
              <div className="text-right">
                <span className="font-medium text-card-foreground">
                  {credits.subscription_credits}
                </span>
                {credits.subscription_credits === 0 && (
                  <span className="text-muted-foreground text-xs ml-1">
                    (Pro: 10/month)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Purchased</span>
              <span className="font-medium text-card-foreground">
                {credits.purchased_credits}
              </span>
            </div>
          </div>
        </div>

        {/* Buy Credits button (placeholder) */}
        <button
          disabled
          className="w-full px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          Buy Credits
        </button>
        <p className="text-xs text-muted-foreground text-center mt-2">Coming soon</p>
      </div>
    </div>
  )
}
