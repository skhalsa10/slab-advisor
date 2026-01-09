/**
 * Ximilar Card Grading Service
 *
 * This module provides server-side functions for grading Pokemon cards
 * using the Ximilar Card Grader API (v2).
 *
 * IMPORTANT: This file should ONLY be imported in Server Components or API routes.
 * It uses server-side environment variables and makes external API calls.
 *
 * @module ximilar-grading-service
 */

import { XIMILAR_API } from '@/constants/constants'
import type {
  XimilarGradingResponse,
  ExtractedGradingData,
} from '@/types/ximilar'

/**
 * Call the Ximilar Card Grader API with base64 encoded images
 *
 * @param frontBase64 - Base64 encoded front image (with data URI prefix)
 * @param backBase64 - Base64 encoded back image (with data URI prefix)
 * @returns Raw Ximilar grading API response
 * @throws Error if API call fails
 */
export async function gradeCard(
  frontBase64: string,
  backBase64: string
): Promise<XimilarGradingResponse> {
  const apiKey = process.env.XIMILAR_API_KEY

  if (!apiKey) {
    throw new Error('XIMILAR_API_KEY environment variable is not set')
  }

  // Remove data URI prefix if present (e.g., "data:image/jpeg;base64,")
  const cleanFrontBase64 = frontBase64.includes(',')
    ? frontBase64.split(',')[1]
    : frontBase64

  const cleanBackBase64 = backBase64.includes(',')
    ? backBase64.split(',')[1]
    : backBase64

  const response = await fetch(XIMILAR_API.GRADE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      records: [
        { _base64: cleanFrontBase64 },
        { _base64: cleanBackBase64 },
      ],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Ximilar Grading API error:', response.status, errorText)

    if (response.status === 401 || response.status === 403) {
      throw new Error('API authentication failed. Please check your API key.')
    }
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment and try again.')
    }
    if (response.status >= 500) {
      throw new Error('The card grading service is temporarily unavailable. Please try again later.')
    }
    throw new Error(`Card grading service error: ${response.status}`)
  }

  return response.json()
}

/**
 * Extract and flatten grading data from Ximilar response for database storage
 *
 * @param response - Raw Ximilar grading API response
 * @returns Flattened grading data ready for database insertion
 * @throws Error if response structure is invalid
 */
export function extractGradingData(
  response: XimilarGradingResponse
): ExtractedGradingData {
  // Validate we have both front and back records
  if (!response.records || response.records.length < 2) {
    throw new Error('Invalid grading response: expected front and back records')
  }

  const frontRecord = response.records[0]
  const backRecord = response.records[1]

  // Validate record statuses
  if (frontRecord._status.code !== 200) {
    throw new Error(`Front image grading failed: ${frontRecord._status.text}`)
  }
  if (backRecord._status.code !== 200) {
    throw new Error(`Back image grading failed: ${backRecord._status.text}`)
  }

  // Extract centering data from card array (first element)
  const frontCard = frontRecord.card?.[0]
  const backCard = backRecord.card?.[0]

  if (!frontCard || !backCard) {
    throw new Error('Invalid grading response: missing card data')
  }

  return {
    // Combined grades from top-level response
    grade_corners: response.grades.corners,
    grade_edges: response.grades.edges,
    grade_surface: response.grades.surface,
    grade_centering: response.grades.centering,
    grade_final: response.grades.final,
    condition: response.grades.condition,

    // Front side
    front_grade_final: frontRecord.grades.final,
    front_centering_lr: frontCard.centering?.['left/right'] || '',
    front_centering_tb: frontCard.centering?.['top/bottom'] || '',

    // Back side
    back_grade_final: backRecord.grades.final,
    back_centering_lr: backCard.centering?.['left/right'] || '',
    back_centering_tb: backCard.centering?.['top/bottom'] || '',

    // Annotated image URLs (temporary - need to download and store)
    front_full_url_card: frontRecord._full_url_card,
    front_exact_url_card: frontRecord._exact_url_card,
    back_full_url_card: backRecord._full_url_card,
    back_exact_url_card: backRecord._exact_url_card,
  }
}

/**
 * Convert Ximilar grading technical errors to user-friendly messages
 */
export function getUserFriendlyGradingError(technicalError: string): string {
  const lowerError = technicalError.toLowerCase()

  // Card detection issues
  if (lowerError.includes('no card') || lowerError.includes('not detected')) {
    return 'Could not detect a card in the image. Make sure the card is clearly visible and well-lit.'
  }

  // Image quality issues
  if (lowerError.includes('blur') || lowerError.includes('quality')) {
    return 'Image is too blurry for accurate grading. Hold the camera steady and try again.'
  }

  if (lowerError.includes('dark') || lowerError.includes('lighting')) {
    return 'Image is too dark for accurate grading. Try taking the photo in better lighting.'
  }

  // Side detection
  if (lowerError.includes('side') || lowerError.includes('back')) {
    return 'Could not detect card orientation. Make sure to capture clear images of both front and back.'
  }

  // Default
  return 'Could not grade the card. Please try taking new photos with better lighting and focus.'
}

/**
 * Validate that a grading response is complete and usable
 *
 * @param response - The Ximilar grading response to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateGradingResponse(
  response: XimilarGradingResponse
): { isValid: boolean; error?: string } {
  // Check top-level status
  if (response.status.code !== 200) {
    return {
      isValid: false,
      error: getUserFriendlyGradingError(response.status.text),
    }
  }

  // Check we have records
  if (!response.records || response.records.length < 2) {
    return {
      isValid: false,
      error: 'Incomplete grading response. Both front and back images are required.',
    }
  }

  // Check individual record statuses
  for (let i = 0; i < response.records.length; i++) {
    const record = response.records[i]
    if (record._status.code !== 200) {
      const side = i === 0 ? 'front' : 'back'
      return {
        isValid: false,
        error: `${side.charAt(0).toUpperCase() + side.slice(1)} image error: ${getUserFriendlyGradingError(record._status.text)}`,
      }
    }
  }

  // Check we have grades
  if (!response.grades || response.grades.final === undefined) {
    return {
      isValid: false,
      error: 'Could not calculate grades from the provided images.',
    }
  }

  return { isValid: true }
}
