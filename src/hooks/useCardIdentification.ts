'use client'

import { useState, useCallback } from 'react'
import type { CardIdentificationResult } from '@/types/ximilar'

export type IdentificationState = 'idle' | 'identifying' | 'success' | 'error'

export interface UseCardIdentificationReturn {
  // State
  state: IdentificationState
  result: CardIdentificationResult | null
  error: string | null

  // Actions
  identifyCard: (base64Image: string) => Promise<CardIdentificationResult | null>
  reset: () => void

  // Computed
  isIdentifying: boolean
}

/**
 * Hook for identifying cards using the Ximilar API
 *
 * Handles calling the identification API, managing state,
 * and providing results.
 *
 * @returns Identification state and control functions
 *
 * @example
 * ```typescript
 * const {
 *   identifyCard,
 *   result,
 *   isIdentifying,
 *   reset
 * } = useCardIdentification()
 *
 * const handleCapture = async (base64: string) => {
 *   const result = await identifyCard(base64)
 *   if (result?.success) {
 *     console.log('Found:', result.bestMatch?.databaseCard?.name)
 *   }
 * }
 * ```
 */
export function useCardIdentification(): UseCardIdentificationReturn {
  const [state, setState] = useState<IdentificationState>('idle')
  const [result, setResult] = useState<CardIdentificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Identify a card from a base64 image
   */
  const identifyCard = useCallback(async (
    base64Image: string
  ): Promise<CardIdentificationResult | null> => {
    setState('identifying')
    setError(null)

    try {
      const response = await fetch('/api/cards/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed: ${response.status}`)
      }

      const data: CardIdentificationResult = await response.json()

      setResult(data)

      if (data.success) {
        setState('success')
      } else {
        setState('error')
        setError(data.error || 'Failed to identify card')
      }

      return data
    } catch (err) {
      console.error('Card identification error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to identify card'
      setError(errorMessage)
      setState('error')

      // Return a failed result
      const failedResult: CardIdentificationResult = {
        success: false,
        capturedImage: base64Image,
        error: errorMessage
      }
      setResult(failedResult)
      return failedResult
    }
  }, [])

  /**
   * Reset state to initial values
   */
  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setError(null)
  }, [])

  return {
    // State
    state,
    result,
    error,

    // Actions
    identifyCard,
    reset,

    // Computed
    isIdentifying: state === 'identifying'
  }
}
