'use client'

import { Sparkles } from 'lucide-react'
import type { CreditDetails } from '@/lib/profile-service'

interface CreditsSectionProps {
  credits: CreditDetails
}

export default function CreditsSection({ credits }: CreditsSectionProps) {
  return (
    <div className="bg-white rounded-lg border border-grey-200 mb-6">
      <div className="px-4 py-3 border-b border-grey-200">
        <h2 className="text-sm font-semibold text-grey-900">Credits</h2>
      </div>
      <div className="p-4">
        {/* Total credits display */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-orange-500" />
          <span className="text-3xl font-bold text-grey-900">
            {credits.credits_remaining}
          </span>
          <span className="text-sm text-grey-500">credits remaining</span>
        </div>

        {/* Breakdown */}
        <div className="bg-grey-50 rounded-lg p-3 mb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-grey-600">Subscription</span>
              <div className="text-right">
                <span className="font-medium text-grey-900">
                  {credits.subscription_credits}
                </span>
                {credits.subscription_credits === 0 && (
                  <span className="text-grey-500 text-xs ml-1">
                    (Pro: 10/month)
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-grey-600">Purchased</span>
              <span className="font-medium text-grey-900">
                {credits.purchased_credits}
              </span>
            </div>
          </div>
        </div>

        {/* Buy Credits button (placeholder) */}
        <button
          disabled
          className="w-full px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-md opacity-50 cursor-not-allowed"
          title="Coming soon"
        >
          Buy Credits
        </button>
        <p className="text-xs text-grey-500 text-center mt-2">Coming soon</p>
      </div>
    </div>
  )
}
