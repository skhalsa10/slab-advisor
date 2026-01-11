'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type OrientationPermission = 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface UseDeviceLevelOptions {
  /** Threshold in degrees for "level" (default: 3) */
  levelThreshold?: number
  /** Update frequency in ms (default: 50) */
  updateInterval?: number
}

export interface UseDeviceLevelReturn {
  // Permission
  permission: OrientationPermission

  // Tilt values (null if not available)
  beta: number | null   // Front/back tilt
  gamma: number | null  // Left/right tilt

  // Level status
  isLevel: boolean

  // State
  isListening: boolean
  isSupported: boolean

  // Actions
  requestPermission: () => Promise<boolean>
  startListening: () => void
  stopListening: () => void
}

// iOS type extension for requestPermission
interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/**
 * Hook for device orientation detection to help users level their phone
 *
 * Uses the DeviceOrientationEvent API to detect phone tilt.
 * Handles iOS 13+ permission requirements (must be triggered by user gesture).
 *
 * @param options - Configuration options
 * @returns Device level state and control functions
 *
 * @example
 * ```typescript
 * const { beta, gamma, isLevel, requestPermission, startListening } = useDeviceLevel()
 *
 * // Must call from user gesture (button click) for iOS
 * const handleEnableLevel = async () => {
 *   const granted = await requestPermission()
 *   if (granted) startListening()
 * }
 * ```
 */
export function useDeviceLevel(options: UseDeviceLevelOptions = {}): UseDeviceLevelReturn {
  const { levelThreshold = 3, updateInterval = 50 } = options

  const [permission, setPermission] = useState<OrientationPermission>('prompt')
  const [beta, setBeta] = useState<number | null>(null)
  const [gamma, setGamma] = useState<number | null>(null)
  const [isListening, setIsListening] = useState(false)

  const lastUpdateRef = useRef<number>(0)
  const handlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null)

  // Check if API is supported (must be in browser and have the API)
  const isSupported = typeof window !== 'undefined' && 'DeviceOrientationEvent' in window

  /**
   * Request permission for device orientation access
   * Required for iOS 13+ - MUST be called from a user gesture (button click)
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPermission('unsupported')
      return false
    }

    const DOE = DeviceOrientationEvent as unknown as DeviceOrientationEventStatic

    // iOS 13+ requires explicit permission request
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission()
        setPermission(result === 'granted' ? 'granted' : 'denied')
        return result === 'granted'
      } catch {
        // iOS throws if not called from user gesture
        console.warn('DeviceOrientation permission must be requested from a user gesture')
        return false
      }
    }

    // Android/other browsers - permission is implicitly granted
    setPermission('granted')
    return true
  }, [isSupported])

  /**
   * Handle orientation events with debouncing
   */
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    const now = Date.now()
    if (now - lastUpdateRef.current < updateInterval) return
    lastUpdateRef.current = now

    setBeta(event.beta ?? null)
    setGamma(event.gamma ?? null)
  }, [updateInterval])

  /**
   * Start listening for orientation events
   * Only works if permission is granted
   */
  const startListening = useCallback(() => {
    if (!isSupported || permission !== 'granted') return

    handlerRef.current = handleOrientation
    window.addEventListener('deviceorientation', handleOrientation)
    setIsListening(true)
  }, [isSupported, permission, handleOrientation])

  /**
   * Stop listening for orientation events
   */
  const stopListening = useCallback(() => {
    if (handlerRef.current) {
      window.removeEventListener('deviceorientation', handlerRef.current)
      handlerRef.current = null
    }
    setIsListening(false)
    setBeta(null)
    setGamma(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  // Compute level status - device is level if both beta and gamma are within threshold
  const isLevel = beta !== null && gamma !== null &&
    Math.abs(beta) <= levelThreshold &&
    Math.abs(gamma) <= levelThreshold

  return {
    permission,
    beta,
    gamma,
    isLevel,
    isListening,
    isSupported,
    requestPermission,
    startListening,
    stopListening,
  }
}
