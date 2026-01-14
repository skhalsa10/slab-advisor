'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useBreakpoint } from '@/hooks/useIsDesktop'
import { isDesktop } from 'react-device-detect'
import type { GradingOpportunity } from '@/types/grading-opportunity'
import { formatPrice } from '@/utils/collectionPriceUtils'
import CameraCapture from '@/components/camera/CameraCapture'
import DesktopUploadZone from '@/components/camera/DesktopUploadZone'
import ImagePreview from './ImagePreview'
import GradingConfirmation from './GradingConfirmation'
import GradingResultView from './GradingResultView'
import GradingTutorialCarousel from './GradingTutorialCarousel'
import AIAnalysisVisualization from './AIAnalysisVisualization'

/**
 * Capture step state for the grading flow
 */
type CaptureStep =
  | 'info' // Current modal content (profit analysis)
  | 'tutorial' // Photography tips tutorial
  | 'front-capture' // Camera UI for front
  | 'front-preview' // Preview front image
  | 'back-capture' // Camera UI for back
  | 'back-preview' // Preview back image
  | 'confirmation' // Review both images before grading
  | 'processing' // Uploading + grading in progress
  | 'complete' // Show grading results
  | 'error' // Show error with retry option

/**
 * Grading result from the API
 */
interface GradingResult {
  id: string
  grade_final: number
  grade_corners: number
  grade_edges: number
  grade_surface: number
  grade_centering: number
  condition: string
  front_centering_lr: string
  front_centering_tb: string
  back_centering_lr: string
  back_centering_tb: string
}

interface GradingAnalysisModalProps {
  opportunities: GradingOpportunity[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  /** Whether to show photography tips before grading (from user preferences) */
  showGradingTips?: boolean
}

/**
 * Responsive modal for grading analysis with multi-step capture flow
 *
 * Flow:
 * 1. Info View - Shows profit analysis and "Start AI Pre-Grade" button
 * 2. Front Capture - Camera UI to capture front of card
 * 3. Front Preview - Preview with "Use This Photo" / "Retake" options
 * 4. Back Capture - Camera UI to capture back of card
 * 5. Back Preview - Preview with "Use This Photo" / "Retake" options
 * 6. Confirmation - Review both images before grading
 * 7. Processing - Upload images and call grading API
 * 8. Complete - Show grading results
 * 9. Error - Show error with retry option
 */
export default function GradingAnalysisModal({
  opportunities,
  initialIndex,
  isOpen,
  onClose,
  onSuccess,
  showGradingTips = true,
}: GradingAnalysisModalProps) {
  const breakpoints = useBreakpoint()

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Derive current opportunity from array
  const opportunity = opportunities[currentIndex] ?? null
  const totalCount = opportunities.length
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < totalCount - 1

  // Step state machine
  const [captureStep, setCaptureStep] = useState<CaptureStep>('info')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal closes or opens with new initialIndex
  useEffect(() => {
    if (!isOpen) {
      setCaptureStep('info')
      setFrontImage(null)
      setBackImage(null)
      setGradingResult(null)
      setError(null)
    } else {
      // Sync currentIndex with initialIndex when modal opens
      setCurrentIndex(initialIndex)
    }
  }, [isOpen, initialIndex])

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (canGoPrevious && captureStep === 'info') {
      setCurrentIndex((prev) => prev - 1)
      // Reset capture state for new card
      setFrontImage(null)
      setBackImage(null)
      setGradingResult(null)
      setError(null)
    }
  }, [canGoPrevious, captureStep])

  const handleNext = useCallback(() => {
    if (canGoNext && captureStep === 'info') {
      setCurrentIndex((prev) => prev + 1)
      // Reset capture state for new card
      setFrontImage(null)
      setBackImage(null)
      setGradingResult(null)
      setError(null)
    }
  }, [canGoNext, captureStep])

  // Keyboard navigation: Escape to close, Arrow keys to navigate (only on info step)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (captureStep !== 'info') return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && canGoPrevious) {
        e.preventDefault()
        handlePrevious()
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault()
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, captureStep, canGoPrevious, canGoNext, handlePrevious, handleNext])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  // Handle closing modal - reset to info or close entirely
  const handleClose = useCallback(() => {
    if (captureStep === 'info' || captureStep === 'complete') {
      onClose()
    } else if (captureStep === 'tutorial') {
      // Go back to info from tutorial
      setCaptureStep('info')
    } else {
      // Go back to info view from other steps
      setCaptureStep('info')
      setFrontImage(null)
      setBackImage(null)
      setError(null)
    }
  }, [captureStep, onClose])

  // Start the capture flow - show tutorial if enabled
  const handleStartPreGrade = useCallback(() => {
    if (showGradingTips) {
      setCaptureStep('tutorial')
    } else {
      setCaptureStep('front-capture')
    }
  }, [showGradingTips])

  // Handle tutorial completion
  const handleTutorialComplete = useCallback((dontShowAgain: boolean) => {
    if (dontShowAgain) {
      // Fire and forget - update user preference
      fetch('/api/profile/grading-tips', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showGradingTips: false }),
      }).catch((err) => {
        console.error('Failed to update grading tips preference:', err)
      })
    }
    setCaptureStep('front-capture')
  }, [])

  // Handle front image capture
  const handleFrontCapture = useCallback((base64Image: string) => {
    setFrontImage(base64Image)
    setCaptureStep('front-preview')
  }, [])

  // Handle front image confirmation
  const handleFrontConfirm = useCallback(() => {
    setCaptureStep('back-capture')
  }, [])

  // Handle front image retake
  const handleFrontRetake = useCallback(() => {
    setFrontImage(null)
    setCaptureStep('front-capture')
  }, [])

  // Handle back image capture
  const handleBackCapture = useCallback((base64Image: string) => {
    setBackImage(base64Image)
    setCaptureStep('back-preview')
  }, [])

  // Handle back image confirmation
  const handleBackConfirm = useCallback(() => {
    setCaptureStep('confirmation')
  }, [])

  // Handle back image retake
  const handleBackRetake = useCallback(() => {
    setBackImage(null)
    setCaptureStep('back-capture')
  }, [])

  // Handle retake from confirmation view
  const handleRetakeFront = useCallback(() => {
    setFrontImage(null)
    setCaptureStep('front-capture')
  }, [])

  const handleRetakeBack = useCallback(() => {
    setBackImage(null)
    setCaptureStep('back-capture')
  }, [])

  // Handle cancel from confirmation
  const handleCancelConfirmation = useCallback(() => {
    setCaptureStep('info')
    setFrontImage(null)
    setBackImage(null)
  }, [])

  // Handle start grading (upload + grade)
  const handleStartGrading = useCallback(async () => {
    if (!opportunity || !frontImage || !backImage) return

    setCaptureStep('processing')
    setError(null)

    try {
      // Step 1: Upload front image
      const frontResponse = await fetch('/api/cards/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionCardId: opportunity.collectionCardId,
          side: 'front',
          image: frontImage,
        }),
      })

      if (!frontResponse.ok) {
        const data = await frontResponse.json()
        throw new Error(data.error || 'Failed to upload front image')
      }

      // Step 2: Upload back image
      const backResponse = await fetch('/api/cards/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionCardId: opportunity.collectionCardId,
          side: 'back',
          image: backImage,
        }),
      })

      if (!backResponse.ok) {
        const data = await backResponse.json()
        throw new Error(data.error || 'Failed to upload back image')
      }

      // Step 3: Call grading API
      const gradeResponse = await fetch('/api/cards/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionCardId: opportunity.collectionCardId,
        }),
      })

      const gradeData = await gradeResponse.json()

      if (!gradeResponse.ok) {
        // Handle specific error cases
        if (gradeResponse.status === 402) {
          throw new Error('Insufficient credits. Please purchase more credits to continue.')
        }
        throw new Error(gradeData.error || 'Failed to grade card')
      }

      // Success!
      setGradingResult(gradeData.grading)
      setCaptureStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setCaptureStep('error')
    }
  }, [opportunity, frontImage, backImage])

  // Handle retry from error state
  const handleRetry = useCallback(() => {
    // If we have both images, go back to confirmation to retry grading
    if (frontImage && backImage) {
      setCaptureStep('confirmation')
    } else {
      // Otherwise start over
      setCaptureStep('info')
      setFrontImage(null)
      setBackImage(null)
    }
    setError(null)
  }, [frontImage, backImage])

  // Handle complete - close modal and trigger refresh
  const handleComplete = useCallback(() => {
    onSuccess?.()
    onClose()
  }, [onClose, onSuccess])

  if (!isOpen || opportunities.length === 0 || !opportunity) return null

  const isMobile = !breakpoints.md

  // Calculate display values for info view
  const rawValue = Number(opportunity.currentMarketPrice) || 0
  const gradingFee =
    Number(opportunity.gradingFeeEntry) || Number(opportunity.gradingFeePsa10) || 25
  const profitPsa10 = Number(opportunity.profitAtPsa10) || 0
  const psa10Value =
    Number(opportunity.psa10Price) || rawValue + gradingFee + profitPsa10

  // Validate image URL for info view
  const imageUrl =
    opportunity.imageUrl &&
    opportunity.imageUrl.trim() &&
    opportunity.imageUrl !== 'null'
      ? opportunity.imageUrl
      : '/card-placeholder.svg'

  // Render capture views (full screen, outside modal)
  // isDesktop (device type): Determines camera vs upload zone
  // breakpoints.lg (screen width): Still used elsewhere for modal layout (bottom sheet vs centered)
  if (captureStep === 'front-capture') {
    if (isDesktop) {
      return (
        <DesktopUploadZone
          onUpload={handleFrontCapture}
          onClose={handleClose}
          title="Upload Front"
          instructionText="Upload a high-resolution scan or photo of the front of your card"
        />
      )
    }
    return (
      <CameraCapture
        onCapture={handleFrontCapture}
        onClose={handleClose}
        title="Capture Front"
        instructionText="Position the front of your card within the frame"
        hideSearchByText
        showLevelIndicator
      />
    )
  }

  if (captureStep === 'back-capture') {
    if (isDesktop) {
      return (
        <DesktopUploadZone
          onUpload={handleBackCapture}
          onClose={handleClose}
          title="Upload Back"
          instructionText="Upload a high-resolution scan or photo of the back of your card"
        />
      )
    }
    return (
      <CameraCapture
        onCapture={handleBackCapture}
        onClose={handleClose}
        title="Capture Back"
        instructionText="Position the back of your card within the frame"
        hideSearchByText
        showLevelIndicator
      />
    )
  }

  // Render preview views (full screen, outside modal)
  if (captureStep === 'front-preview' && frontImage) {
    return (
      <ImagePreview
        image={frontImage}
        title="Front of Card"
        onConfirm={handleFrontConfirm}
        onRetake={handleFrontRetake}
      />
    )
  }

  if (captureStep === 'back-preview' && backImage) {
    return (
      <ImagePreview
        image={backImage}
        title="Back of Card"
        onConfirm={handleBackConfirm}
        onRetake={handleBackRetake}
      />
    )
  }

  // Determine modal content based on step
  let content: React.ReactNode

  if (captureStep === 'tutorial') {
    content = (
      <GradingTutorialCarousel
        onComplete={handleTutorialComplete}
        onBack={() => setCaptureStep('info')}
      />
    )
  } else if (captureStep === 'confirmation' && frontImage && backImage) {
    content = (
      <GradingConfirmation
        opportunity={opportunity}
        frontImage={frontImage}
        backImage={backImage}
        onStartGrading={handleStartGrading}
        onRetakeFront={handleRetakeFront}
        onRetakeBack={handleRetakeBack}
        onCancel={handleCancelConfirmation}
      />
    )
  } else if (captureStep === 'processing' && frontImage) {
    content = (
      <AIAnalysisVisualization
        frontImageSrc={frontImage}
        backImageSrc={backImage ?? undefined}
      />
    )
  } else if (captureStep === 'complete' && gradingResult) {
    content = (
      <GradingResultView
        gradingResult={gradingResult}
        cardName={opportunity.cardName}
        onClose={handleComplete}
      />
    )
  } else if (captureStep === 'error') {
    content = (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-grey-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-grey-900">Error</h2>
          <button
            onClick={handleClose}
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
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <svg
            className="w-16 h-16 text-red-500 mb-4"
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
          <p className="text-grey-900 font-medium text-center mb-2">
            Something went wrong
          </p>
          <p className="text-grey-600 text-sm text-center mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  } else {
    // Default: Info view
    content = (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-grey-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-grey-900">Grading Analysis</h2>
          <button
            onClick={onClose}
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

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Card info header */}
          <div className="flex items-center gap-3">
            <Image
              src={imageUrl}
              alt={opportunity.cardName}
              width={60}
              height={84}
              className="rounded-md flex-shrink-0"
              unoptimized={imageUrl.includes('ximilar.com')}
            />
            <div className="min-w-0">
              {/* Card name + badge inline */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-grey-900">{opportunity.cardName}</p>
                {/* Strategy Badge - based on PSA 9 profitability */}
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${
                    (opportunity.profitAtPsa9 ?? 0) > 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {(opportunity.profitAtPsa9 ?? 0) > 0 ? 'Safe Bet' : 'PSA 10 Required'}
                </span>
              </div>
              <p className="text-sm text-grey-500">
                {opportunity.setName}
                {opportunity.cardNumber ? ` #${opportunity.cardNumber}` : ''}
              </p>
            </div>
          </div>

          {/* Math breakdown card */}
          <div className="bg-grey-50 rounded-lg p-4 space-y-3">
            <p className="text-xs text-grey-500 font-medium uppercase tracking-wide">
              Profit Analysis
            </p>

            {/* PSA 10 breakdown */}
            <div className="bg-white rounded-md p-3 border border-green-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-grey-900">PSA 10 Potential</span>
                <span className="text-lg font-bold text-green-600">
                  +{formatPrice(profitPsa10)}
                </span>
              </div>
              <div className="mt-2 text-xs text-grey-500 space-y-1">
                <div className="flex justify-between">
                  <span>Graded Value (PSA 10)</span>
                  <span>{formatPrice(psa10Value)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Raw Value</span>
                  <span>-{formatPrice(rawValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Grading Fee</span>
                  <span>-{formatPrice(gradingFee)}</span>
                </div>
                {opportunity.roiPsa10 != null && (
                  <div className="flex justify-between pt-1 border-t border-grey-200 font-medium">
                    <span>ROI</span>
                    <span className="text-green-600">
                      {Number(opportunity.roiPsa10).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* PSA 9 safety net (if available) */}
            {opportunity.profitAtPsa9 != null && (
              <div
                className={`${
                  (opportunity.profitAtPsa9 ?? 0) < 0 ? 'bg-red-50' : 'bg-grey-100'
                } rounded-md p-3`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-grey-600">PSA 9 Safety Net</span>
                  <span
                    className={`font-medium ${
                      Number(opportunity.profitAtPsa9) >= 0
                        ? 'text-grey-700'
                        : 'text-red-600'
                    }`}
                  >
                    {Number(opportunity.profitAtPsa9) >= 0 ? '+' : ''}
                    {formatPrice(Number(opportunity.profitAtPsa9))}
                  </span>
                </div>
                <p className="text-xs text-grey-500 mt-1">
                  If graded PSA 9 instead of 10
                </p>
              </div>
            )}
          </div>

          {/* Disclaimers */}
          <div className="bg-orange-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-orange-800">
              Important Disclaimers
            </p>
            <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
              <li>AI grading results do not guarantee actual PSA grade</li>
              <li>Always perform visual inspection for major damage</li>
              <li>This tool assists pre-grading decisions only</li>
            </ul>
          </div>
        </div>

        {/* Footer with CTA */}
        <div className="p-4 border-t border-grey-200 flex-shrink-0 space-y-3">
          <button
            onClick={handleStartPreGrade}
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
            Start AI Pre-Grade
          </button>
          {opportunity.cardNumber && (
            <p className="text-xs text-grey-500 text-center">
              Make sure you have Card #{opportunity.cardNumber} ready.
            </p>
          )}

          {/* Mobile Navigation Bar */}
          {isMobile && totalCount > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={!canGoPrevious}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  canGoPrevious
                    ? 'text-grey-700 hover:bg-grey-100'
                    : 'text-grey-300 cursor-not-allowed'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Prev
              </button>

              <span className="text-sm text-grey-500">
                {currentIndex + 1} of {totalCount}
              </span>

              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  canGoNext
                    ? 'text-grey-700 hover:bg-grey-100'
                    : 'text-grey-300 cursor-not-allowed'
                }`}
              >
                Next
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </>
    )
  }

  // Modal container (only for non-camera views)
  if (isMobile) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={captureStep === 'info' ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl flex flex-col"
          style={{ maxHeight: '90vh' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="grading-analysis-title"
        >
          {content}
        </div>
      </>
    )
  }

  // Tablet/Desktop: Centered modal with navigation arrows hugging the modal
  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={captureStep === 'info' ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Container for arrows + modal using flex layout */}
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        {/* Previous Button - hugs left side of modal */}
        {totalCount > 1 && captureStep === 'info' && (
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className={`pointer-events-auto mr-4 p-3 rounded-full bg-white shadow-lg transition-all flex-shrink-0 ${
              canGoPrevious
                ? 'hover:bg-grey-100 text-grey-700 cursor-pointer'
                : 'text-grey-300 cursor-not-allowed'
            }`}
            aria-label="Previous card"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Modal */}
        <div
          className="pointer-events-auto w-full max-w-md bg-white rounded-lg shadow-xl flex flex-col mx-4"
          style={{ maxHeight: '90vh' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="grading-analysis-title"
        >
          {content}
        </div>

        {/* Next Button - hugs right side of modal */}
        {totalCount > 1 && captureStep === 'info' && (
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`pointer-events-auto ml-4 p-3 rounded-full bg-white shadow-lg transition-all flex-shrink-0 ${
              canGoNext
                ? 'hover:bg-grey-100 text-grey-700 cursor-pointer'
                : 'text-grey-300 cursor-not-allowed'
            }`}
            aria-label="Next card"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
