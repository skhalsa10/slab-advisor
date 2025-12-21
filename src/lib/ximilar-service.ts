/**
 * Ximilar API Service for Card Identification
 *
 * This module provides server-side functions for identifying Pokemon cards
 * using the Ximilar TCG Identification API.
 *
 * IMPORTANT: This file should ONLY be imported in Server Components or API routes.
 * It uses server-side environment variables and makes external API calls.
 *
 * @module ximilar-service
 */

import { XIMILAR_API } from '@/constants/constants'
import { matchCardByXimilarMetadata } from './pokemon-db-server'
import type {
  XimilarIdentificationResponse,
  IdentificationData,
  CardIdentificationResult
} from '@/types/ximilar'

/**
 * Call the Ximilar TCG Identification API
 *
 * @param base64Image - Base64 encoded image data (with or without data URI prefix)
 * @returns Raw Ximilar API response
 * @throws Error if API call fails
 */
async function callXimilarIdentifyApi(
  base64Image: string
): Promise<XimilarIdentificationResponse> {
  const apiKey = process.env.XIMILAR_API_KEY

  if (!apiKey) {
    throw new Error('XIMILAR_API_KEY environment variable is not set')
  }

  // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanBase64 = base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image

  const response = await fetch(XIMILAR_API.IDENTIFY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: [
        {
          _base64: cleanBase64
        }
      ],
      // Filter to only return English Pokemon cards
      filter: "Subcategory = 'Pokemon'",
      lang: 'en',
      // Auto-rotate card if image is sideways or upside down
      auto_rotate: true
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Ximilar API error:', response.status, errorText)

    // Return a structured error response instead of throwing
    // This allows the caller to handle it gracefully
    if (response.status === 401 || response.status === 403) {
      throw new Error('API authentication failed. Please check your API key.')
    }
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (response.status >= 500) {
      throw new Error('The card identification service is temporarily unavailable. Please try again later.')
    }
    throw new Error(`Card identification service error: ${response.status}`)
  }

  return response.json()
}

/**
 * Convert Ximilar technical errors to user-friendly messages
 */
function getUserFriendlyError(technicalError: string): string {
  const lowerError = technicalError.toLowerCase()

  // Card side/category errors
  if (lowerError.includes('not allowed') && lowerError.includes('side')) {
    return 'Please scan the front of the card, not the back.'
  }

  if (lowerError.includes('category') && lowerError.includes('not allowed')) {
    return 'Could not recognize this as a Pokemon card. Make sure you\'re scanning the front of a Pokemon TCG card.'
  }

  // Image quality issues
  if (lowerError.includes('blur') || lowerError.includes('quality')) {
    return 'Image is too blurry. Hold the camera steady and try again.'
  }

  if (lowerError.includes('dark') || lowerError.includes('lighting')) {
    return 'Image is too dark. Try scanning in better lighting.'
  }

  // Default - return a cleaned up version
  return 'Could not identify the card. Try taking another photo with better lighting and focus.'
}

/**
 * Extract identification data from Ximilar response
 *
 * Ximilar returns identification data nested within objects.
 * This function extracts it from the first detected card/object.
 *
 * @param response - Raw Ximilar API response
 * @returns Identification data or null if not found
 */
function extractIdentification(
  response: XimilarIdentificationResponse
): IdentificationData | null {
  if (!response.records || response.records.length === 0) {
    return null
  }

  const record = response.records[0]

  // Check record status
  if (record._status.code !== 200) {
    return { error: getUserFriendlyError(record._status.text) }
  }

  // Look for identification in _objects array
  if (record._objects && record._objects.length > 0) {
    for (const obj of record._objects) {
      // Check if identification has an error
      if (obj._identification?.error) {
        return { error: getUserFriendlyError(obj._identification.error) }
      }
      if (obj._identification) {
        return obj._identification
      }
    }
  }

  return { error: 'No card detected in image. Make sure the card is clearly visible.' }
}

/**
 * Identify a Pokemon card from an image using Ximilar API
 *
 * This is the main public function for card identification.
 * It calls the Ximilar API, extracts matches, and looks up
 * corresponding cards in our database.
 *
 * @param base64Image - Base64 encoded image of the card
 * @returns CardIdentificationResult with best match and alternatives
 *
 * @example
 * ```typescript
 * const result = await identifyCard(base64ImageData)
 * if (result.success && result.bestMatch) {
 *   console.log('Found:', result.bestMatch.databaseCard?.name)
 * }
 * ```
 */
export async function identifyCard(
  base64Image: string
): Promise<CardIdentificationResult> {
  try {
    // Call Ximilar API
    const response = await callXimilarIdentifyApi(base64Image)

    // Extract identification data
    const identification = extractIdentification(response)

    if (!identification) {
      return {
        success: false,
        capturedImage: base64Image,
        error: 'No card detected in image'
      }
    }

    if (identification.error) {
      return {
        success: false,
        capturedImage: base64Image,
        error: identification.error
      }
    }

    // Process best match
    let bestMatch = null
    if (identification.best_match) {
      console.log('=== XIMILAR BEST MATCH DATA ===')
      console.log(JSON.stringify(identification.best_match, null, 2))
      console.log('=== END XIMILAR BEST MATCH ===')

      const databaseCard = await matchCardByXimilarMetadata(identification.best_match)
      console.log('=== DATABASE MATCH RESULT ===')
      console.log(databaseCard ? JSON.stringify(databaseCard, null, 2) : 'No match found')
      console.log('=== END DATABASE MATCH ===')

      bestMatch = {
        ximilarMatch: identification.best_match,
        databaseCard: databaseCard || undefined,
        confidence: 1.0 // Ximilar returns best_match as highest confidence
      }
    }

    // Process alternatives
    const alternatives: CardIdentificationResult['alternatives'] = []
    if (identification.alternatives && identification.alternatives.length > 0) {
      for (const alt of identification.alternatives) {
        const databaseCard = await matchCardByXimilarMetadata(alt)
        alternatives.push({
          ximilarMatch: alt,
          databaseCard: databaseCard || undefined,
          confidence: 0.8 // Alternatives have lower confidence
        })
      }
    }

    // If we have no best match and no alternatives, it's a failure
    if (!bestMatch && alternatives.length === 0) {
      return {
        success: false,
        capturedImage: base64Image,
        error: 'Could not identify the card'
      }
    }

    return {
      success: true,
      bestMatch: bestMatch || undefined,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      capturedImage: base64Image
    }
  } catch (error) {
    console.error('Card identification error:', error)
    return {
      success: false,
      capturedImage: base64Image,
      error: error instanceof Error ? error.message : 'Failed to identify card'
    }
  }
}
