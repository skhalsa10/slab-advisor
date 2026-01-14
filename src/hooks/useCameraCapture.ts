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

/** Debug info for torch/flash detection */
export interface TorchDebugInfo {
  trackLabel: string
  hasGetCapabilities: boolean
  capabilities: Record<string, unknown> | null
  torchInCapabilities: boolean
  facingMode: string
  error: string | null
}

export interface UseCameraCaptureReturn {
  // State
  cameraState: CameraState
  error: string | null
  hasPermission: boolean | null
  isFlashOn: boolean
  hasFlash: boolean

  // Refs
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>

  // Actions
  startCamera: () => Promise<boolean>
  stopCamera: () => void
  capturePhoto: () => string | null
  switchCamera: () => Promise<boolean>
  toggleFlash: () => Promise<boolean>

  // Utilities
  isFrontCamera: boolean

  // Debug
  torchDebug: TorchDebugInfo | null
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
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [hasFlash, setHasFlash] = useState(false)
  const [torchDebug, setTorchDebug] = useState<TorchDebugInfo | null>(null)

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

    // Reset flash state when stream stops
    setIsFlashOn(false)
    setHasFlash(false)
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

      // Check for flash/torch capability with debug info
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const debugInfo: TorchDebugInfo = {
          trackLabel: videoTrack.label || 'unknown',
          hasGetCapabilities: typeof videoTrack.getCapabilities === 'function',
          capabilities: null,
          torchInCapabilities: false,
          facingMode: currentFacingMode,
          error: null,
        }

        try {
          if (typeof videoTrack.getCapabilities === 'function') {
            const capabilities = videoTrack.getCapabilities()
            // Store a subset of capabilities for debug (avoid huge objects)
            debugInfo.capabilities = {
              torch: (capabilities as Record<string, unknown>).torch,
              facingMode: (capabilities as Record<string, unknown>).facingMode,
              deviceId: (capabilities as Record<string, unknown>).deviceId,
            }
            debugInfo.torchInCapabilities = 'torch' in capabilities
            setHasFlash('torch' in capabilities)
          } else {
            debugInfo.error = 'getCapabilities not a function'
            setHasFlash(false)
          }
        } catch (err) {
          debugInfo.error = err instanceof Error ? err.message : 'Unknown error'
          setHasFlash(false)
        }

        setTorchDebug(debugInfo)
      }

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

    // Stop current stream first
    stopMediaStream()

    // Wait for camera hardware to be released
    // This delay is crucial on mobile devices to prevent "camera in use" errors
    await new Promise(resolve => setTimeout(resolve, 300))

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
      setCurrentFacingMode(newFacingMode)

      // Check for flash capability on new camera
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        try {
          const capabilities = videoTrack.getCapabilities?.()
          const supportsTorch = capabilities && 'torch' in capabilities
          setHasFlash(!!supportsTorch)
        } catch {
          setHasFlash(false)
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraState('active')
        return true
      }

      return false
    } catch (err) {
      console.error('Failed to switch camera:', err)
      setError('Failed to switch camera. Please try again.')
      setCameraState('error')
      return false
    }
  }, [currentFacingMode, stopMediaStream])

  /**
   * Toggle flash/torch on or off
   */
  const toggleFlash = useCallback(async (): Promise<boolean> => {
    if (!streamRef.current || !hasFlash) {
      return false
    }

    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (!videoTrack) {
      return false
    }

    try {
      const newFlashState = !isFlashOn
      // Apply torch constraint to the track
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashState } as MediaTrackConstraintSet]
      })
      setIsFlashOn(newFlashState)
      return true
    } catch (err) {
      console.error('Failed to toggle flash:', err)
      return false
    }
  }, [hasFlash, isFlashOn])

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
    isFlashOn,
    hasFlash,

    // Refs
    videoRef,
    canvasRef,

    // Actions
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    toggleFlash,

    // Utilities
    isFrontCamera: currentFacingMode === 'user',

    // Debug
    torchDebug,
  }
}
