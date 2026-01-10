'use client'

import { useEffect, useRef } from 'react'
import { useCameraCapture } from '@/hooks/useCameraCapture'

interface CameraCaptureProps {
  onCapture: (base64Image: string) => void
  onClose: () => void
  onGallerySelect?: () => void
  onSearchByText?: () => void
  isProcessing?: boolean
  /** Custom header title (default: "Scan Card") */
  title?: string
  /** Custom instruction text (default: "Align card within the frame") */
  instructionText?: string
  /** Hide the "or search by text" link (default: false) */
  hideSearchByText?: boolean
}

/**
 * Full-screen camera capture component
 *
 * Displays camera viewfinder with card alignment guide,
 * capture button, and gallery upload option.
 */
export default function CameraCapture({
  onCapture,
  onClose,
  onGallerySelect,
  onSearchByText,
  isProcessing = false,
  title = 'Scan Card',
  instructionText = 'Align card within the frame',
  hideSearchByText = false,
}: CameraCaptureProps) {
  const {
    videoRef,
    canvasRef,
    cameraState,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    isFrontCamera
  } = useCameraCapture()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  const handleCapture = () => {
    if (isProcessing) return

    const base64 = capturePhoto()
    if (base64) {
      onCapture(base64)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      if (base64) {
        onCapture(base64)
      }
    }
    reader.readAsDataURL(file)

    // Reset input for re-selection
    event.target.value = ''
  }

  const handleGalleryClick = () => {
    if (onGallerySelect) {
      onGallerySelect()
    } else {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent safe-area-top">
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close camera"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <span className="text-white font-medium">{title}</span>

        <button
          onClick={switchCamera}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          aria-label="Switch camera"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
        />

        {/* Card alignment guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Semi-transparent overlay with cutout */}
          <div className="relative w-full h-full">
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Card frame cutout - standard trading card aspect ratio 2.5:3.5 */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] max-w-[280px] aspect-[2.5/3.5]">
              {/* Clear area */}
              <div className="absolute inset-0 bg-black/40" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />

              {/* Border frame */}
              <div className="absolute inset-0 border-2 border-white rounded-lg">
                {/* Corner accents */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-orange-500 rounded-tl-lg" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-orange-500 rounded-tr-lg" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-orange-500 rounded-bl-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-orange-500 rounded-br-lg" />
              </div>
            </div>
          </div>

          {/* Instruction text */}
          <div className="absolute bottom-44 left-0 right-0 text-center">
            <p className="text-white text-sm font-medium drop-shadow-lg">
              {instructionText}
            </p>
          </div>
        </div>

        {/* Loading/Error states */}
        {cameraState === 'requesting' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>Requesting camera access...</p>
            </div>
          </div>
        )}

        {cameraState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-center text-white px-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-lg font-medium mb-2">Camera Error</p>
              <p className="text-sm text-grey-300 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Identifying card...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pb-8 pt-4 bg-gradient-to-t from-black/70 to-transparent safe-area-bottom">
        <div className="flex flex-col items-center">
          {/* Main controls row */}
          <div className="flex items-center justify-around w-full px-8">
            {/* Gallery button */}
            <button
              onClick={handleGalleryClick}
              disabled={isProcessing}
              className="p-3 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"
              aria-label="Choose from gallery"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>

            {/* Capture button */}
            <button
              onClick={handleCapture}
              disabled={cameraState !== 'active' || isProcessing}
              className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
              aria-label="Take photo"
            >
              <div className="w-16 h-16 rounded-full bg-white" />
            </button>

            {/* Placeholder for symmetry */}
            <div className="w-14 h-14" />
          </div>

          {/* Search by text link */}
          {!hideSearchByText && (
            <button
              onClick={onSearchByText}
              disabled={isProcessing}
              className="mt-4 text-white/80 hover:text-white text-sm transition-colors disabled:opacity-50"
            >
              or search by text
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
