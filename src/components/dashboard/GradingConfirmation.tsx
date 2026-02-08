'use client'

import type { GradingOpportunity } from '@/types/grading-opportunity'

interface GradingConfirmationProps {
  /** Card opportunity data for header display */
  opportunity: GradingOpportunity
  /** Base64 encoded front image */
  frontImage: string
  /** Base64 encoded back image */
  backImage: string
  /** Called when user clicks "Start AI Grading" */
  onStartGrading: () => void
  /** Called when user wants to retake front image */
  onRetakeFront: () => void
  /** Called when user wants to retake back image */
  onRetakeBack: () => void
  /** Called when user cancels and goes back to info view */
  onCancel: () => void
}

/**
 * Confirmation view before starting AI grading
 *
 * Shows both captured images side-by-side with options to retake,
 * displays credit cost, and allows user to confirm grading.
 */
export default function GradingConfirmation({
  opportunity,
  frontImage,
  backImage,
  onStartGrading,
  onRetakeFront,
  onRetakeBack,
  onCancel,
}: GradingConfirmationProps) {
  // Validate image URL for the card header
  const cardImageUrl =
    opportunity.imageUrl && opportunity.imageUrl.trim() && opportunity.imageUrl !== 'null'
      ? opportunity.imageUrl
      : '/card-placeholder.svg'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-grey-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-grey-900">Review Images</h2>
        <button
          onClick={onCancel}
          className="text-grey-400 hover:text-grey-600 transition-colors p-1"
          aria-label="Cancel"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Card info header */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic URL, TODO: Use Next/Image */}
          <img
            src={cardImageUrl}
            alt={opportunity.cardName}
            className="w-12 h-16 rounded-md object-cover"
          />
          <div>
            <p className="font-semibold text-grey-900">{opportunity.cardName}</p>
            <p className="text-sm text-grey-500">{opportunity.setName}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                opportunity.gradingSafetyTier === 'SAFE_BET'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-orange-100 text-orange-700'
              }`}
            >
              {opportunity.gradingSafetyTier === 'SAFE_BET' ? 'Safe Bet' : 'Gamble'}
            </span>
          </div>
        </div>

        {/* Image previews */}
        <div className="grid grid-cols-2 gap-3">
          {/* Front image */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-grey-700 text-center">Front</p>
            <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-grey-100 border border-grey-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- TODO: Refactor to blob URLs */}
              <img
                src={frontImage}
                alt="Front of card"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={onRetakeFront}
              className="w-full py-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Retake
            </button>
          </div>

          {/* Back image */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-grey-700 text-center">Back</p>
            <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-grey-100 border border-grey-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- TODO: Refactor to blob URLs */}
              <img
                src={backImage}
                alt="Back of card"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={onRetakeBack}
              className="w-full py-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            >
              Retake
            </button>
          </div>
        </div>

        {/* Credit cost notice */}
        <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-700">
            This will use <span className="font-semibold">1 credit</span> from your account.
          </p>
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="p-4 border-t border-grey-200 flex-shrink-0 space-y-2">
        <button
          onClick={onStartGrading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          {/* Sparkles icon */}
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
          Start AI Grading
        </button>

        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-grey-600 font-medium hover:text-grey-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
