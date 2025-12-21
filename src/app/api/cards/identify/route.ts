import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-server'
import { identifyCard } from '@/lib/ximilar-service'
import { HTTP_STATUS } from '@/constants/constants'

interface IdentifyCardRequest {
  image: string // base64 encoded image
}

/**
 * POST /api/cards/identify
 *
 * Identify a Pokemon card from an image using Ximilar API.
 * Requires authentication. Only charges credits on successful identification.
 *
 * Request body:
 * - image: base64 encoded image string (with or without data URI prefix)
 *
 * Response:
 * - success: boolean
 * - bestMatch?: { ximilarMatch, databaseCard, confidence }
 * - alternatives?: Array<{ ximilarMatch, databaseCard, confidence }>
 * - capturedImage: string (the original base64 image)
 * - error?: string (only present when success is false)
 */
export async function POST(request: Request) {
  try {
    // Authentication check
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Parse request body
    const body: IdentifyCardRequest = await request.json()

    if (!body.image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate image format (basic check)
    const isValidBase64 = body.image.includes('base64,') ||
      /^[A-Za-z0-9+/=]+$/.test(body.image.substring(0, 100))

    if (!isValidBase64) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 encoded image.' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Call Ximilar identification service
    const result = await identifyCard(body.image)

    // TODO: Charge credits only on successful identification
    // if (result.success && result.bestMatch) {
    //   await deductCredits(user.id, CREDIT_COSTS.CARD_ANALYSIS)
    // }

    // Always return 200 with the result - the success field indicates outcome
    // This allows the client to display the error message properly
    return NextResponse.json(result)
  } catch (error) {
    console.error('Card identification API error:', error)

    // Return 200 with error in body so client can display it
    // Only use 500 for truly unexpected errors
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to identify card. Please try again.'

    return NextResponse.json({
      success: false,
      error: errorMessage,
      capturedImage: ''
    })
  }
}
