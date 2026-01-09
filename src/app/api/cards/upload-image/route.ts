import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth-server'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { uploadCardImage } from '@/lib/storage-service'
import { HTTP_STATUS } from '@/constants/constants'

interface UploadImageRequest {
  collectionCardId: string
  side: 'front' | 'back'
  image: string // base64 encoded image
}

interface UploadImageResponse {
  success: boolean
  path?: string
  error?: string
}

/**
 * POST /api/cards/upload-image
 *
 * Upload a card image (front or back) for a collection card.
 * Requires authentication. User must own the collection card.
 *
 * Request body:
 * - collectionCardId: UUID of the collection card
 * - side: 'front' | 'back'
 * - image: base64 encoded image string (with or without data URI prefix)
 *
 * Response:
 * - success: boolean
 * - path?: storage path of uploaded image
 * - error?: string (only present when success is false)
 */
export async function POST(request: Request): Promise<NextResponse<UploadImageResponse>> {
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
    const body: UploadImageRequest = await request.json()

    // Validate required fields
    if (!body.collectionCardId) {
      return NextResponse.json(
        { success: false, error: 'collectionCardId is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (!body.side || !['front', 'back'].includes(body.side)) {
      return NextResponse.json(
        { success: false, error: 'side must be "front" or "back"' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    if (!body.image) {
      return NextResponse.json(
        { success: false, error: 'image is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Validate image format
    // Check for data URI format first (e.g., "data:image/jpeg;base64,/9j/4AAQ...")
    const dataUriMatch = body.image.match(/^data:([^;]+);base64,(.+)$/)

    if (dataUriMatch) {
      // Validate the MIME type in the data URI
      const mimeType = dataUriMatch[1]
      const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!validMimeTypes.includes(mimeType)) {
        return NextResponse.json(
          { success: false, error: `Invalid image type: ${mimeType}. Allowed: JPEG, PNG, WebP` },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }

      // Validate the base64 portion is well-formed (check full string, not just first 100 chars)
      const base64Portion = dataUriMatch[2]
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Portion)) {
        return NextResponse.json(
          { success: false, error: 'Invalid base64 encoding in image data' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    } else {
      // Raw base64 without data URI prefix - validate entire string
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(body.image)) {
        return NextResponse.json(
          { success: false, error: 'Invalid image format. Expected base64 encoded image.' },
          { status: HTTP_STATUS.BAD_REQUEST }
        )
      }
    }

    // Verify user owns the collection card
    const supabase = getServerSupabaseClient()
    const { data: card, error: cardError } = await supabase
      .from('collection_cards')
      .select('id, user_id')
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

    // Upload the image
    const { path, error: uploadError } = await uploadCardImage(
      user.id,
      body.collectionCardId,
      body.side,
      body.image
    )

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Update the collection card with the image path
    const updateField = body.side === 'front' ? 'front_image_url' : 'back_image_url'
    const { error: updateError } = await supabase
      .from('collection_cards')
      .update({ [updateField]: path })
      .eq('id', body.collectionCardId)

    if (updateError) {
      console.error('Failed to update collection card with image path:', updateError)
      return NextResponse.json(
        { success: false, error: 'Image uploaded but failed to update card record' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({
      success: true,
      path,
    })
  } catch (error) {
    console.error('Upload image API error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Failed to upload image. Please try again.'

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
