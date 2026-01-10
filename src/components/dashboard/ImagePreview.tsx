'use client'

interface ImagePreviewProps {
  /** Base64 encoded image to preview */
  image: string
  /** Title displayed at top (e.g., "Front of Card", "Back of Card") */
  title: string
  /** Called when user confirms the image */
  onConfirm: () => void
  /** Called when user wants to retake the photo */
  onRetake: () => void
}

/**
 * Full-screen image preview component
 *
 * Shows captured image with options to use or retake.
 * Used in the grading capture flow after taking a photo.
 */
export default function ImagePreview({
  image,
  title,
  onConfirm,
  onRetake,
}: ImagePreviewProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-center p-4 bg-gradient-to-b from-black/70 to-transparent">
        <h2 className="text-white font-medium text-lg">{title}</h2>
      </div>

      {/* Image preview */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <img
          src={image}
          alt={`Preview of ${title}`}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>

      {/* Bottom controls */}
      <div className="flex-shrink-0 p-4 pb-8 bg-gradient-to-t from-black/70 to-transparent safe-area-bottom">
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          {/* Use This Photo button */}
          <button
            onClick={onConfirm}
            className="w-full py-3 px-4 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            Use This Photo
          </button>

          {/* Retake button */}
          <button
            onClick={onRetake}
            className="w-full py-3 px-4 bg-transparent text-white font-medium rounded-lg border border-white/50 hover:bg-white/10 transition-colors"
          >
            Retake
          </button>
        </div>
      </div>
    </div>
  )
}
