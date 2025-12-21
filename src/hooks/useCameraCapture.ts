'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type CameraState = 'idle' | 'requesting' | 'active' | 'error'

export interface UseCameraCaptureOptions {
  /**
   * Preferred facing mode for mobile devices
   * @default 'environment' (back camera)
   */
  facingMode?: 'user' | 'environment'
  /**
   * Image quality for captured photos (0-1)
   * @default 0.92
   */
  imageQuality?: number
  /**
   * Image format for captured photos
   * @default 'image/jpeg'
   */
  imageFormat?: 'image/jpeg' | 'image/png' | 'image/webp'
}

export interface UseCameraCaptureReturn {
  // State
  cameraState: CameraState
  error: string | null
  hasPermission: boolean | null

  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>

  // Actions
  startCamera: () => Promise<boolean>
  stopCamera: () => void
  capturePhoto: () => string | null
  switchCamera: () => Promise<boolean>

  // Utilities
  isFrontCamera: boolean
}

/**
 * Hook for managing camera access and photo capture
 *
 * Handles requesting camera permissions, managing video stream,
 * and capturing photos as base64 strings.
 *
 * @param options - Configuration options
 * @returns Camera state and control functions
 *
 * @example
 * ```typescript
 * const {
 *   videoRef,
 *   cameraState,
 *   startCamera,
 *   capturePhoto,
 *   stopCamera
 * } = useCameraCapture()
 *
 * // Start camera when component mounts
 * useEffect(() => {
 *   startCamera()
 *   return () => stopCamera()
 * }, [])
 *
 * // Capture photo
 * const handleCapture = () => {
 *   const base64 = capturePhoto()
 *   if (base64) {
 *     // Use the captured image
 *   }
 * }
 * ```
 */
export function useCameraCapture(
  options: UseCameraCaptureOptions = {}
): UseCameraCaptureReturn {
  const {
    facingMode = 'environment',
    imageQuality = 0.92,
    imageFormat = 'image/jpeg'
  } = options

  // State
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>(facingMode)

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /**
   * Stop all tracks in the current media stream
   */
  const stopMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  /**
   * Request camera access and start video stream
   */
  const startCamera = useCallback(async (): Promise<boolean> => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      setError('Camera not available')
      setCameraState('error')
      return false
    }

    // Check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      const currentUrl = window.location.hostname
      setError(`Camera requires HTTPS. Current: ${currentUrl}. Use localhost or enable HTTPS.`)
      setCameraState('error')
      setHasPermission(false)
      return false
    }

    // Check for browser support - mediaDevices may not be available immediately
    // Some browsers need a small delay for mediaDevices to be available
    await new Promise(resolve => setTimeout(resolve, 100))

    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('mediaDevices check failed:', {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol
      })
      setError('Camera API not available. Try Chrome, Safari, or Firefox on HTTPS.')
      setCameraState('error')
      setHasPermission(false)
      return false
    }

    setCameraState('requesting')
    setError(null)

    try {
      // Stop any existing stream
      stopMediaStream()

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })

      streamRef.current = stream
      setHasPermission(true)

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current
          if (!video) {
            reject(new Error('Video element not found'))
            return
          }

          video.onloadedmetadata = () => {
            video.play()
              .then(() => resolve())
              .catch(reject)
          }

          video.onerror = () => reject(new Error('Video failed to load'))
        })

        setCameraState('active')
        return true
      } else {
        throw new Error('Video element not available')
      }
    } catch (err) {
      console.error('Camera access error:', err)

      let errorMessage = 'Failed to access camera'

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.'
          setHasPermission(false)
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = 'No camera found on this device.'
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'Camera is in use by another application.'
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera does not meet requirements.'
        } else {
          errorMessage = err.message || 'Failed to access camera'
        }
      }

      setError(errorMessage)
      setCameraState('error')
      return false
    }
  }, [currentFacingMode, stopMediaStream])

  /**
   * Stop camera and release resources
   */
  const stopCamera = useCallback(() => {
    stopMediaStream()
    setCameraState('idle')
  }, [stopMediaStream])

  /**
   * Capture current video frame as base64 image
   */
  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || cameraState !== 'active') {
      console.warn('Cannot capture: camera not active or elements not ready')
      return null
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw current video frame to canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Could not get canvas context')
      return null
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64
    try {
      const base64 = canvas.toDataURL(imageFormat, imageQuality)
      return base64
    } catch (err) {
      console.error('Failed to capture photo:', err)
      return null
    }
  }, [cameraState, imageFormat, imageQuality])

  /**
   * Switch between front and back camera
   */
  const switchCamera = useCallback(async (): Promise<boolean> => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user'
    setCurrentFacingMode(newFacingMode)

    // Restart camera with new facing mode
    stopMediaStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: newFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        return true
      }

      return false
    } catch (err) {
      console.error('Failed to switch camera:', err)
      setError('Failed to switch camera')
      // Try to restore previous camera
      setCurrentFacingMode(currentFacingMode)
      await startCamera()
      return false
    }
  }, [currentFacingMode, startCamera, stopMediaStream])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaStream()
    }
  }, [stopMediaStream])

  return {
    // State
    cameraState,
    error,
    hasPermission,

    // Refs
    videoRef,
    canvasRef,

    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,

    // Utilities
    isFrontCamera: currentFacingMode === 'user'
  }
}
