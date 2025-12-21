'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSetOwnership } from '@/hooks/useSetOwnership'

interface SetOwnershipSummaryProps {
  totalCards: number
  setId: string
  setName: string
  onRefetchReady?: (refetch: () => Promise<void>) => void
  variant?: 'circle' | 'bar'
  showTitle?: boolean
}

/**
 * Interpolates between color stops based on percentage to create a smooth
 * red → orange → yellow → green transition
 */
function getProgressColor(percentage: number): string {
  const stops = [
    { pct: 0, color: { r: 239, g: 68, b: 68 } },    // red-500
    { pct: 33, color: { r: 249, g: 115, b: 22 } },  // orange-500
    { pct: 66, color: { r: 234, g: 179, b: 8 } },   // yellow-500
    { pct: 100, color: { r: 34, g: 197, b: 94 } },  // green-500
  ]

  // Clamp percentage between 0 and 100
  const pct = Math.max(0, Math.min(100, percentage))

  // Find the two stops to interpolate between
  let lower = stops[0]
  let upper = stops[stops.length - 1]

  for (let i = 0; i < stops.length - 1; i++) {
    if (pct >= stops[i].pct && pct <= stops[i + 1].pct) {
      lower = stops[i]
      upper = stops[i + 1]
      break
    }
  }

  // Calculate interpolation factor
  const range = upper.pct - lower.pct
  const factor = range === 0 ? 0 : (pct - lower.pct) / range

  // Interpolate RGB values
  const r = Math.round(lower.color.r + (upper.color.r - lower.color.r) * factor)
  const g = Math.round(lower.color.g + (upper.color.g - lower.color.g) * factor)
  const b = Math.round(lower.color.b + (upper.color.b - lower.color.b) * factor)

  return `rgb(${r}, ${g}, ${b})`
}

export default function SetOwnershipSummary({ totalCards, setId, setName, onRefetchReady, variant = 'circle', showTitle = true }: SetOwnershipSummaryProps) {
  const { user, loading: authLoading } = useAuth()
  const { ownedCount, percentage, isLoading, refetch } = useSetOwnership(setId, totalCards)

  // Pass refetch function to parent when ready
  useEffect(() => {
    if (onRefetchReady && user) {
      onRefetchReady(refetch)
    }
  }, [onRefetchReady, refetch, user])

  // Don't render if not logged in (hide for unauthenticated users)
  if (!authLoading && !user) {
    return null
  }

  // Loading skeleton
  if (authLoading || isLoading) {
    if (variant === 'bar') {
      return (
        <div className="animate-pulse">
          <div className="h-5 bg-grey-200 rounded w-32 mb-2" />
          <div className="h-3 bg-grey-200 rounded-full w-full" />
        </div>
      )
    }
    return (
      <div className="animate-pulse flex flex-col items-center">
        {showTitle && <div className="h-6 bg-grey-200 rounded w-40 mb-4" />}
        <div className="w-44 h-44 bg-grey-200 rounded-full" />
      </div>
    )
  }

  const remaining = totalCards - ownedCount
  const isComplete = percentage >= 100
  const progressColor = getProgressColor(percentage)

  // Bar variant - compact horizontal progress bar
  if (variant === 'bar') {
    return (
      <div>
        {/* Header with title and stats */}
        <div className="flex items-center justify-between mb-2">
          {showTitle ? (
            <>
              <h3 className="text-sm font-semibold text-grey-900">
                {setName} Set
              </h3>
              <span className="text-sm font-medium text-grey-700">
                {isComplete ? '100%' : `${percentage.toFixed(0)}%`}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-grey-900">
              {isComplete ? '100% complete' : `${percentage.toFixed(0)}% complete`}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-3 bg-grey-200 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: progressColor,
              boxShadow: isComplete ? '0 0 8px rgba(34, 197, 94, 0.5)' : undefined
            }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-grey-600">
            {ownedCount} / {totalCards} cards
          </span>
          {!isComplete && remaining > 0 && (
            <span className="text-xs text-grey-500">
              {remaining} to go
            </span>
          )}
          {isComplete && (
            <span className="text-xs font-medium text-green-600">
              Complete!
            </span>
          )}
        </div>

        {/* Encouraging message for empty collection */}
        {ownedCount === 0 && (
          <p className="text-xs text-grey-500 mt-1">
            Start your collection!
          </p>
        )}
      </div>
    )
  }

  // SVG circle calculations
  const size = 176 // w-44 = 176px
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      {/* Title - centered */}
      {showTitle && (
        <h3 className="text-lg font-semibold text-grey-900 mb-4 text-center">
          {setName} Set
        </h3>
      )}

      {/* Circular progress container */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className={`w-44 h-44 ${isComplete ? 'animate-pulse-glow' : ''}`}
          style={isComplete ? {
            filter: 'drop-shadow(0 0 12px rgba(34, 197, 94, 0.5))'
          } : undefined}
        >
          {/* Background circle (track) */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-grey-200"
          />
          {/* Progress circle */}
          {percentage > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>

        {/* Center content - absolutely positioned */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isComplete ? (
            <>
              <span className="text-xl font-bold text-green-600">Set</span>
              <span className="text-xl font-bold text-green-600">Complete</span>
              <span className="text-sm font-semibold text-grey-600 mt-1">
                100% complete
              </span>
            </>
          ) : (
            <>
              <span className="text-4xl font-bold text-grey-900">{remaining}</span>
              <span className="text-sm text-grey-600">cards to go</span>
              <span className="text-sm font-semibold text-grey-700 mt-1">
                {percentage.toFixed(0)}% complete
              </span>
            </>
          )}
        </div>
      </div>

      {/* Encouraging message for empty collection */}
      {ownedCount === 0 && (
        <p className="text-sm text-grey-500 text-center mt-3">
          Start your collection!
        </p>
      )}
    </div>
  )
}
