'use client'

import { useState } from 'react'

interface GradingTutorialCarouselProps {
  onComplete: (dontShowAgain: boolean) => void
  onBack: () => void
}

/**
 * Placeholder card component for tutorial examples
 */
function PlaceholderCard({
  label,
  isGood,
}: {
  label: string
  isGood: boolean
}) {
  return (
    <div className="relative">
      <div
        className={`bg-grey-200 rounded-lg aspect-[2.5/3.5] flex items-center justify-center p-2 ${
          isGood ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
        }`}
      >
        <span className="text-xs text-grey-600 text-center leading-tight">
          {label}
        </span>
      </div>
      {/* Badge overlay */}
      <div
        className={`absolute -top-2 -right-2 rounded-full p-1 ${
          isGood ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {isGood ? (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
    </div>
  )
}

/**
 * Small placeholder for the 4-item grid (Slide 5)
 */
function SmallPlaceholderCard({
  label,
  isGood,
}: {
  label: string
  isGood: boolean
}) {
  return (
    <div className="relative">
      <div
        className={`bg-grey-200 rounded-md aspect-square flex items-center justify-center p-1 ${
          isGood ? 'ring-2 ring-green-500' : 'ring-2 ring-red-500'
        }`}
      >
        <span className="text-[10px] text-grey-600 text-center leading-tight">
          {label}
        </span>
      </div>
      {/* Badge overlay */}
      <div
        className={`absolute -top-1.5 -right-1.5 rounded-full p-0.5 ${
          isGood ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {isGood ? (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-2.5 h-2.5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </div>
    </div>
  )
}

/**
 * Slide 1: Welcome & Important Instructions
 */
function WelcomeSlide() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      {/* Large Red Exclamation Circle */}
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-bold text-grey-900 mb-3">
        Welcome & Important Instructions
      </h3>

      <p className="text-grey-600">
        Please read every slide carefully. Skipping even one may affect your
        grading accuracy.
      </p>
    </div>
  )
}

/**
 * Slide 2: Solid Background
 */
function BackgroundSlide() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <h3 className="text-xl font-bold text-grey-900 mb-4">Solid Background</h3>

      {/* 3 placeholders in a row */}
      <div className="grid grid-cols-3 gap-4 mb-4 w-full max-w-xs">
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Multi-color Background" isGood={false} />
          <span className="text-xs text-grey-500">Multi-color</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Plain White Background" isGood={true} />
          <span className="text-xs text-grey-500">Plain White</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Plain Black Background" isGood={true} />
          <span className="text-xs text-grey-500">Plain Black</span>
        </div>
      </div>

      <p className="text-grey-600 text-sm">
        Use a plain, solid background for your card. Avoid patterned or textured
        surfaces.
      </p>
    </div>
  )
}

/**
 * Slide 3: No Sleeves or Protectors
 */
function NoSleevesSlide() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <h3 className="text-xl font-bold text-grey-900 mb-4">
        No Sleeves or Protectors
      </h3>

      {/* 3 placeholders in a row */}
      <div className="grid grid-cols-3 gap-4 mb-4 w-full max-w-xs">
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Card in Graded Slab" isGood={false} />
          <span className="text-xs text-grey-500">Slab</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Card in Sleeve" isGood={false} />
          <span className="text-xs text-grey-500">Sleeved</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Bare Card (No Protection)" isGood={true} />
          <span className="text-xs text-grey-500">Bare</span>
        </div>
      </div>

      <p className="text-grey-600 text-sm">
        Your card must be bare—remove any slabs, sleeves, or protectors before
        taking your photo.
      </p>
    </div>
  )
}

/**
 * Slide 4: Proper Framing & Distance
 */
function FramingSlide() {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <h3 className="text-xl font-bold text-grey-900 mb-4">
        Proper Framing & Distance
      </h3>

      {/* 3 placeholders in a row */}
      <div className="grid grid-cols-3 gap-4 mb-4 w-full max-w-xs">
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Card Fills Frame Properly" isGood={true} />
          <span className="text-xs text-grey-500">Ideal</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Card Too Small / Far Away" isGood={false} />
          <span className="text-xs text-grey-500">Too Far</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <PlaceholderCard label="Edges Cropped Off" isGood={false} />
          <span className="text-xs text-grey-500">Too Close</span>
        </div>
      </div>

      <p className="text-grey-600 text-sm">
        Hold your camera so the card is properly framed. Not too far, not too
        close.
      </p>
    </div>
  )
}

/**
 * Slide 5: Take It Level (Final Slide)
 */
function LevelSlide({
  dontShowAgain,
  setDontShowAgain,
}: {
  dontShowAgain: boolean
  setDontShowAgain: (value: boolean) => void
}) {
  return (
    <div className="flex flex-col items-center text-center px-4">
      <h3 className="text-xl font-bold text-grey-900 mb-4">Take It Level</h3>

      {/* 4 placeholders in a 2x2 grid */}
      <div className="grid grid-cols-4 gap-3 mb-4 w-full max-w-xs">
        <div className="flex flex-col items-center gap-1">
          <SmallPlaceholderCard label="Crooked" isGood={false} />
          <span className="text-[10px] text-grey-500">Crooked</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <SmallPlaceholderCard label="Tilted" isGood={false} />
          <span className="text-[10px] text-grey-500">Tilted</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <SmallPlaceholderCard label="Horizontal" isGood={false} />
          <span className="text-[10px] text-grey-500">Horizontal</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <SmallPlaceholderCard label="Straight & Level" isGood={true} />
          <span className="text-[10px] text-grey-500">Level</span>
        </div>
      </div>

      <p className="text-grey-600 text-sm mb-4">
        Keep your card straight and level. Avoid tilting, rotating, or shooting
        at an angle.
      </p>

      {/* Checkbox */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(e) => setDontShowAgain(e.target.checked)}
          className="w-4 h-4 rounded border-grey-300 text-orange-600 focus:ring-orange-500"
        />
        <span className="text-sm text-grey-600">
          Don&apos;t show these tips again
        </span>
      </label>
    </div>
  )
}

/**
 * Progress dots indicator
 */
function ProgressDots({
  total,
  current,
}: {
  total: number
  current: number
}) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${
            i === current ? 'bg-orange-500' : 'bg-grey-300'
          }`}
        />
      ))}
    </div>
  )
}

/**
 * Pre-Scan Tutorial Carousel
 *
 * Shows 5 slides teaching users how to take proper photos for AI grading.
 * DeckTradr-inspired onboarding flow.
 */
export default function GradingTutorialCarousel({
  onComplete,
  onBack,
}: GradingTutorialCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const totalSlides = 5
  const isLastSlide = currentSlide === totalSlides - 1
  const isFirstSlide = currentSlide === 0

  const handleNext = () => {
    if (isLastSlide) {
      onComplete(dontShowAgain)
    } else {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (isFirstSlide) {
      onBack()
    } else {
      setCurrentSlide((prev) => prev - 1)
    }
  }

  // Render current slide content
  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return <WelcomeSlide />
      case 1:
        return <BackgroundSlide />
      case 2:
        return <NoSleevesSlide />
      case 3:
        return <FramingSlide />
      case 4:
        return (
          <LevelSlide
            dontShowAgain={dontShowAgain}
            setDontShowAgain={setDontShowAgain}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-grey-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-grey-900">
          Photo Tips ({currentSlide + 1}/{totalSlides})
        </h2>
        <button
          onClick={onBack}
          className="text-grey-400 hover:text-grey-600 transition-colors p-1"
          aria-label="Close"
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

      {/* Body - Slide Content */}
      <div className="flex-1 flex flex-col justify-center py-6 overflow-y-auto">
        {renderSlide()}
      </div>

      {/* Footer - Progress & Navigation */}
      <div className="p-4 border-t border-grey-200 flex-shrink-0 space-y-4">
        {/* Progress Dots */}
        <ProgressDots total={totalSlides} current={currentSlide} />

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {/* Back Button */}
          <button
            onClick={handlePrevious}
            className="flex-1 px-4 py-3 border border-grey-300 text-grey-700 font-medium rounded-lg hover:bg-grey-50 transition-colors"
          >
            {isFirstSlide ? 'Cancel' : 'Back'}
          </button>

          {/* Next / Open Camera Button */}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            {isLastSlide ? (
              <>
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
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Open Camera
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
