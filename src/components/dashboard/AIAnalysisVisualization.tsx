'use client'

import { useState, useEffect } from 'react'

interface AIAnalysisVisualizationProps {
  frontImageSrc: string
  backImageSrc?: string
}

/** Analysis step definition */
interface AnalysisStep {
  id: number
  activeLabel: string
  completedLabel: string
}

/** The 4 simulated analysis steps */
const ANALYSIS_STEPS: AnalysisStep[] = [
  {
    id: 1,
    activeLabel: 'Detecting Card Edges & Crop...',
    completedLabel: 'Edges Detected',
  },
  {
    id: 2,
    activeLabel: 'Analyzing Centering & Geometry...',
    completedLabel: 'Centering Analyzed',
  },
  {
    id: 3,
    activeLabel: 'Scanning Surface via Computer Vision...',
    completedLabel: 'Surface Scan Complete',
  },
  {
    id: 4,
    activeLabel: 'Finalizing AI Grade Prediction...',
    completedLabel: 'Grade Predicted',
  },
]

/** Time between step transitions in ms */
const STEP_DURATION = 3000

/**
 * AI Analysis Visualization Component
 *
 * Displays an engaging "lab" visualization while the AI processes the card.
 * The progress is simulated with timers since we don't get real-time updates.
 * The animation pauses on the final step until the API response arrives.
 */
export default function AIAnalysisVisualization({
  frontImageSrc,
  backImageSrc,
}: AIAnalysisVisualizationProps) {
  // Current active step (1-4), steps below this are complete
  const [currentStep, setCurrentStep] = useState(1)

  // Simulate progress through the steps
  useEffect(() => {
    if (currentStep >= ANALYSIS_STEPS.length) {
      // Stay on final step indefinitely until unmounted
      return
    }

    const timer = setTimeout(() => {
      setCurrentStep((prev) => prev + 1)
    }, STEP_DURATION)

    return () => clearTimeout(timer)
  }, [currentStep])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-grey-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-grey-900">Analyzing Card...</h2>
        <button
          disabled
          className="px-3 py-1.5 text-sm text-grey-400 bg-grey-100 rounded-lg cursor-not-allowed"
        >
          Cancel
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Card Images with Scanner Effect */}
        <div className="relative flex gap-4 mb-8">
          {/* Front Card */}
          <div className="relative overflow-hidden rounded-lg shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element -- TODO: Refactor to blob URLs */}
            <img
              src={frontImageSrc}
              alt="Front of card"
              className="w-32 h-44 object-cover rounded-lg"
            />
            {/* Scanner Beam Overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              <div className="scanner-beam absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 shadow-[0_0_15px_5px_rgba(34,211,238,0.5)]" />
            </div>
          </div>

          {/* Back Card (if provided) */}
          {backImageSrc && (
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- TODO: Refactor to blob URLs */}
              <img
                src={backImageSrc}
                alt="Back of card"
                className="w-32 h-44 object-cover rounded-lg"
              />
              {/* Scanner Beam Overlay - delayed animation */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                <div className="scanner-beam scanner-beam-delayed absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80 shadow-[0_0_15px_5px_rgba(34,211,238,0.5)]" />
              </div>
            </div>
          )}
        </div>

        {/* Progress Checklist */}
        <div className="w-full max-w-sm space-y-3">
          {ANALYSIS_STEPS.map((step) => {
            const isComplete = step.id < currentStep
            const isActive = step.id === currentStep
            const isWaiting = step.id > currentStep

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 transition-all duration-300 ${
                  isWaiting ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  {isComplete ? (
                    // Green checkmark
                    <svg
                      className="w-6 h-6 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isActive ? (
                    // Blue spinner
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    // Empty circle
                    <div className="w-5 h-5 border-2 border-grey-300 rounded-full" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-sm font-medium transition-colors duration-300 ${
                    isComplete
                      ? 'text-green-600'
                      : isActive
                        ? 'text-blue-600'
                        : 'text-grey-400'
                  }`}
                >
                  {isComplete ? step.completedLabel : step.activeLabel}
                </span>
              </div>
            )
          })}
        </div>

        {/* Subtle hint text */}
        <p className="mt-6 text-xs text-grey-400 text-center">
          Our AI is analyzing your card&apos;s condition...
        </p>
      </div>

      {/* CSS for scanner animation */}
      <style jsx>{`
        .scanner-beam {
          animation: scan 2s ease-in-out infinite;
        }

        .scanner-beam-delayed {
          animation-delay: 1s;
        }

        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: calc(100% - 4px);
          }
          100% {
            top: 0;
          }
        }
      `}</style>
    </div>
  )
}
