'use client'

import { useState, useRef, useCallback } from 'react'
import QRCode from 'react-qr-code'

interface DesktopUploadZoneProps {
  onUpload: (base64Image: string) => void
  onClose: () => void
  /** Custom header title (default: "Upload Card") */
  title?: string
  /** Custom instruction text below the upload zone */
  instructionText?: string
}

/** Accepted image file types */
const VALID_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/bmp',
  'image/tiff',
]

/** File extensions for display */
const SUPPORTED_FORMATS = 'JPG, PNG, WEBP, HEIC'

/**
 * Desktop Upload Zone Component
 *
 * Full-screen upload interface for desktop users.
 * Webcams are disabled to ensure grading accuracy.
 * Supports drag & drop and file browser.
 */
export default function DesktopUploadZone({
  onUpload,
  onClose,
  title = 'Upload Card',
  instructionText = 'Upload a high-resolution scan or photo of your card',
}: DesktopUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Simple link to dashboard - user can continue grading from there
  const dashboardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard`
    : '/dashboard'

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      // Validate file type
      if (!VALID_FILE_TYPES.includes(file.type)) {
        setError(`Please upload a ${SUPPORTED_FORMATS} image`)
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        setError('File is too large. Maximum size is 10MB.')
        return
      }

      // Convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        if (base64) {
          onUpload(base64)
        }
      }
      reader.onerror = () => {
        setError('Failed to read file. Please try again.')
      }
      reader.readAsDataURL(file)
    },
    [onUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
      }
      // Reset input for re-selection
      e.target.value = ''
    },
    [handleFile]
  )

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dashboardUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [dashboardUrl])

  return (
    <div className="fixed inset-0 z-50 bg-grey-900 flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-grey-700">
        <button
          onClick={onClose}
          className="p-2 text-grey-400 hover:text-white hover:bg-grey-700 rounded-full transition-colors"
          aria-label="Close"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <span className="text-white font-medium">{title}</span>

        {/* Spacer for symmetry */}
        <div className="w-10 h-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Warning Banner */}
        <div className="w-full max-w-lg mb-6 p-4 bg-amber-900/50 border border-amber-500/50 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5"
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
            <p className="text-amber-100 text-sm">
              Webcams are disabled to ensure grading accuracy. Please upload a
              high-resolution scan or photo taken with your phone.
            </p>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`w-full max-w-lg p-8 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-grey-500 hover:border-orange-500 hover:bg-grey-800/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {/* Cloud Upload Icon */}
          <svg
            className="w-16 h-16 mx-auto mb-4 text-grey-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-grey-300 text-lg mb-2">
            Drag & drop your card scan here
          </p>
          <p className="text-grey-500 text-sm mb-4">or</p>

          <button
            type="button"
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleBrowseClick()
            }}
          >
            Browse Files
          </button>

          <p className="text-grey-500 text-xs mt-4">
            Supports: {SUPPORTED_FORMATS}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-lg mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Instruction Text */}
        <p className="text-grey-400 text-sm mt-4 text-center max-w-md">
          {instructionText}
        </p>

        {/* QR Code Section */}
        <div className="mt-8 p-4 bg-grey-800 rounded-lg border border-grey-700 max-w-xs w-full">
          <div className="flex items-center gap-2 mb-3 justify-center">
            <svg
              className="w-5 h-5 text-grey-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="text-grey-400 text-sm font-medium">
              Switch to Mobile
            </p>
          </div>

          {/* QR Code with white background */}
          <div className="bg-white p-2 rounded-lg mx-auto w-fit">
            <QRCode
              value={dashboardUrl}
              size={128}
              level="M"
            />
          </div>

          <p className="text-grey-500 text-xs text-center mt-3">
            Scan with your phone to continue there
          </p>

          {/* Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-grey-400 hover:text-white hover:bg-grey-700 rounded-lg transition-colors text-sm"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
