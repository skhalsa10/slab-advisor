import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getUser } from '@/lib/auth-server'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { getImageAsBase64, downloadAndStoreImage } from '@/lib/storage-service'
import {
  gradeCard,
  extractGradingData,
  validateGradingResponse,
} from '@/lib/ximilar-grading-service'
import { checkUserCredits, deductUserCredits, refundUserCredit } from '@/utils/credits'
import { HTTP_STATUS, CREDIT_COSTS } from '@/constants/constants'
import type { CollectionCardGradingInsert } from '@/types/database'
import type { XimilarGradingResponse } from '@/types/ximilar'

interface GradeCardRequest {
  collectionCardId: string
}

interface GradeCardResponse {
  success: boolean
  grading?: {
    id: string
    grade_final: number
    grade_corners: number
    grade_edges: number
    grade_surface: number
    grade_centering: number
    condition: string
    front_centering_lr: string
    front_centering_tb: string
    back_centering_lr: string
    back_centering_tb: string
  }
  error?: string
}

/**
 * POST /api/cards/grade
 *
 * Grade a collection card using Ximilar's card grading API.
 * Requires authentication. User must own the collection card.
 * Card must have both front and back images uploaded.
 * Costs 1 credit.
 *
 * Request body:
 * - collectionCardId: UUID of the collection card to grade
 *
 * Response:
 * - success: boolean
 * - grading?: Grading results with all grade details
 * - error?: string (only present when success is false)
 */
export async function POST(request: Request): Promise<NextResponse<GradeCardResponse>> {
  const startTime = Date.now()
  try {
    // Authentication check
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Parse request body
    const body: GradeCardRequest = await request.json()

    if (!body.collectionCardId) {
      return NextResponse.json(
        { success: false, error: 'collectionCardId is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const supabase = getServerSupabaseClient()

    // Verify user owns the collection card and has images
    const { data: card, error: cardError } = await supabase
      .from('collection_cards')
      .select('id, user_id, front_image_url, back_image_url')
      .eq('id', body.collectionCardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json(
        { success: false, error: 'Collection card not found' },
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }

    if (card.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'You do not own this collection card' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Validate card has both images
    if (!card.front_image_url || !card.back_image_url) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both front and back images are required for grading',
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Deduct credit FIRST to prevent race conditions
    // This is atomic - if user doesn't have credits, it will fail
    const deductResult = await deductUserCredits(supabase, user.id)
    if (!deductResult.success) {
      // Check if it's insufficient credits vs other error
      const creditCheck = await checkUserCredits(supabase, user.id, CREDIT_COSTS.CARD_GRADING)
      if (!creditCheck.hasCredits) {
        return NextResponse.json(
          { success: false, error: 'Insufficient credits for grading' },
          { status: HTTP_STATUS.PAYMENT_REQUIRED }
        )
      }
      // Other deduction error
      return NextResponse.json(
        { success: false, error: 'Failed to process credits. Please try again.' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Helper function to refund credit and return error response
    const refundAndReturnError = async (
      errorMessage: string,
      status: number
    ): Promise<NextResponse<GradeCardResponse>> => {
      console.error('Grading failed, refunding credit:', errorMessage)
      const refundResult = await refundUserCredit(supabase, user.id)
      if (!refundResult.success) {
        console.error('Failed to refund credit:', refundResult.error)
        // Still return the original error, but log the refund failure
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status }
      )
    }

    // Download images from storage and convert to base64
    const { base64: frontBase64, error: frontError } = await getImageAsBase64(card.front_image_url)
    if (frontError) {
      return refundAndReturnError(
        `Failed to load front image: ${frontError}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    const { base64: backBase64, error: backError } = await getImageAsBase64(card.back_image_url)
    if (backError) {
      return refundAndReturnError(
        `Failed to load back image: ${backError}`,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    // Call Ximilar grading API
    let gradingResponse: XimilarGradingResponse
    try {
      gradingResponse = await Sentry.startSpan(
        {
          op: 'http.client',
          name: 'Ximilar Card Grading',
          attributes: { 'ximilar.endpoint': 'grading' }
        },
        async () => gradeCard(frontBase64, backBase64)
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Grading service error'
      return refundAndReturnError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    // Validate the response
    const validation = validateGradingResponse(gradingResponse)
    if (!validation.isValid) {
      return refundAndReturnError(
        validation.error || 'Invalid grading response',
        HTTP_STATUS.BAD_REQUEST
      )
    }

    // Extract grading data for database
    const extractedData = extractGradingData(gradingResponse)

    // Download and store Ximilar's annotated images (they're temporary)
    const [frontFullResult, frontExactResult, backFullResult, backExactResult] =
      await Sentry.startSpan(
        {
          op: 'function',
          name: 'Download Annotated Images',
          attributes: { 'card.id': body.collectionCardId }
        },
        async () => Promise.all([
          downloadAndStoreImage(
            user.id,
            body.collectionCardId,
            extractedData.front_full_url_card,
            'front_graded_full.webp'
          ),
          downloadAndStoreImage(
            user.id,
            body.collectionCardId,
            extractedData.front_exact_url_card,
            'front_graded_exact.webp'
          ),
          downloadAndStoreImage(
            user.id,
            body.collectionCardId,
            extractedData.back_full_url_card,
            'back_graded_full.webp'
          ),
          downloadAndStoreImage(
            user.id,
            body.collectionCardId,
            extractedData.back_exact_url_card,
            'back_graded_exact.webp'
          ),
        ])
      )

    // Log any image storage errors but don't fail the request
    if (frontFullResult.error) {
      console.warn('Failed to store front full annotated image:', frontFullResult.error)
    }
    if (frontExactResult.error) {
      console.warn('Failed to store front exact annotated image:', frontExactResult.error)
    }
    if (backFullResult.error) {
      console.warn('Failed to store back full annotated image:', backFullResult.error)
    }
    if (backExactResult.error) {
      console.warn('Failed to store back exact annotated image:', backExactResult.error)
    }

    // Delete any existing grading records for this card (we only keep the latest)
    const { error: deleteError } = await supabase
      .from('collection_card_gradings')
      .delete()
      .eq('collection_card_id', body.collectionCardId)

    if (deleteError) {
      console.warn('Failed to delete existing grading records:', deleteError)
      // Don't fail - we can still insert the new one
    }

    // Create grading record
    const gradingInsert: CollectionCardGradingInsert = {
      collection_card_id: body.collectionCardId,
      user_id: user.id,
      raw_response: JSON.parse(JSON.stringify(gradingResponse)),
      grade_corners: extractedData.grade_corners,
      grade_edges: extractedData.grade_edges,
      grade_surface: extractedData.grade_surface,
      grade_centering: extractedData.grade_centering,
      grade_final: extractedData.grade_final,
      condition: extractedData.condition,
      front_grade_final: extractedData.front_grade_final,
      front_centering_lr: extractedData.front_centering_lr,
      front_centering_tb: extractedData.front_centering_tb,
      back_grade_final: extractedData.back_grade_final,
      back_centering_lr: extractedData.back_centering_lr,
      back_centering_tb: extractedData.back_centering_tb,
      front_annotated_full_url: frontFullResult.path || null,
      front_annotated_exact_url: frontExactResult.path || null,
      back_annotated_full_url: backFullResult.path || null,
      back_annotated_exact_url: backExactResult.path || null,
    }

    const { data: grading, error: insertError } = await supabase
      .from('collection_card_gradings')
      .insert(gradingInsert)
      .select('id')
      .single()

    if (insertError || !grading) {
      console.error('Failed to insert grading record:', insertError)
      return refundAndReturnError(
        'Failed to save grading results',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    // Credit was already deducted at the start of the request
    // Grading completed successfully, no refund needed

    // Track successful grading metrics
    Sentry.metrics.count('cards_graded', 1, {
      attributes: { status: 'success' }
    })
    Sentry.metrics.count('credits_consumed', 1, {
      attributes: { operation: 'grading' }
    })
    Sentry.metrics.distribution('card_grading_latency', Date.now() - startTime, {
      unit: 'millisecond'
    })

    return NextResponse.json({
      success: true,
      grading: {
        id: grading.id,
        grade_final: extractedData.grade_final,
        grade_corners: extractedData.grade_corners,
        grade_edges: extractedData.grade_edges,
        grade_surface: extractedData.grade_surface,
        grade_centering: extractedData.grade_centering,
        condition: extractedData.condition,
        front_centering_lr: extractedData.front_centering_lr,
        front_centering_tb: extractedData.front_centering_tb,
        back_centering_lr: extractedData.back_centering_lr,
        back_centering_tb: extractedData.back_centering_tb,
      },
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'cards/grade', operation: 'grade_card' },
      extra: { stage: 'unknown' }
    })
    Sentry.metrics.count('cards_graded', 1, {
      attributes: { status: 'failed' }
    })
    Sentry.metrics.distribution('card_grading_latency', Date.now() - startTime, {
      unit: 'millisecond'
    })
    console.error('Grade card API error:', error)

    // Note: We can't refund here because we don't have supabase or user context
    // and we don't know if credit was already deducted
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to grade card. Please try again.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
