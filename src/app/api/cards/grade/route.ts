import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-server'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { getImageAsBase64, downloadAndStoreImage } from '@/lib/storage-service'
import {
  gradeCard,
  extractGradingData,
  validateGradingResponse,
} from '@/lib/ximilar-grading-service'
import { checkUserCredits, deductUserCredits } from '@/utils/credits'
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

    // Check user has sufficient credits
    const creditCheck = await checkUserCredits(supabase, user.id, CREDIT_COSTS.CARD_GRADING)
    if (!creditCheck.hasCredits) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits for grading' },
        { status: HTTP_STATUS.PAYMENT_REQUIRED }
      )
    }

    // Download images from storage and convert to base64
    const { base64: frontBase64, error: frontError } = await getImageAsBase64(card.front_image_url)
    if (frontError) {
      return NextResponse.json(
        { success: false, error: `Failed to load front image: ${frontError}` },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    const { base64: backBase64, error: backError } = await getImageAsBase64(card.back_image_url)
    if (backError) {
      return NextResponse.json(
        { success: false, error: `Failed to load back image: ${backError}` },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Call Ximilar grading API
    let gradingResponse: XimilarGradingResponse
    try {
      gradingResponse = await gradeCard(frontBase64, backBase64)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Grading service error'
      return NextResponse.json(
        { success: false, error: message },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Validate the response
    const validation = validateGradingResponse(gradingResponse)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Extract grading data for database
    const extractedData = extractGradingData(gradingResponse)

    // Download and store Ximilar's annotated images (they're temporary)
    const [frontFullResult, frontExactResult, backFullResult, backExactResult] =
      await Promise.all([
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
      return NextResponse.json(
        { success: false, error: 'Failed to save grading results' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Update collection card with estimated grade
    const { error: updateError } = await supabase
      .from('collection_cards')
      .update({ estimated_grade: Math.round(extractedData.grade_final) })
      .eq('id', body.collectionCardId)

    if (updateError) {
      console.warn('Failed to update collection card estimated_grade:', updateError)
      // Don't fail the request for this
    }

    // Deduct credit
    const deductResult = await deductUserCredits(supabase, user.id)
    if (!deductResult.success) {
      console.warn('Failed to deduct credit:', deductResult.error)
      // Don't fail the request - grading is already done
    }

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
    console.error('Grade card API error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to grade card. Please try again.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
