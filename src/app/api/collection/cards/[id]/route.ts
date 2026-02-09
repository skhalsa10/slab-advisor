import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-server'

// Allowed variant pattern values - must match database CHECK constraint
const ALLOWED_VARIANT_PATTERNS = ['poke_ball', 'master_ball'] as const

/**
 * Validates variant_pattern value against allowed list
 * @param pattern - The pattern value to validate
 * @returns Validated pattern or null
 * @throws Error if pattern is invalid
 */
function validateVariantPattern(pattern: string | null | undefined): string | null {
  if (pattern === null || pattern === undefined || pattern === '') {
    return null
  }

  // Type guard to ensure only allowed values
  if (ALLOWED_VARIANT_PATTERNS.includes(pattern as typeof ALLOWED_VARIANT_PATTERNS[number])) {
    return pattern
  }

  throw new Error(`Invalid variant_pattern: ${pattern}. Allowed values: ${ALLOWED_VARIANT_PATTERNS.join(', ')}`)
}

interface UpdateCollectionRequest {
  quantity?: number
  condition?: string
  acquisition_price?: number | null
  acquisition_date?: string | null
  notes?: string | null
  variant?: string
  variant_pattern?: string | null
}

/**
 * GET - Fetch a single collection card with joined Pokemon data
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = getServerSupabaseClient()

    // Fetch collection card with joined Pokemon data
    const { data: card, error } = await supabase
      .from('collection_cards')
      .select(`
        *,
        pokemon_card:pokemon_cards (
          id,
          name,
          local_id,
          rarity,
          image,
          category,
          illustrator,
          tcgplayer_image_url,
          variant_normal,
          variant_holo,
          variant_reverse,
          variant_first_edition,
          variant_poke_ball,
          variant_master_ball,
          set:pokemon_sets (
            id,
            name,
            logo,
            symbol,
            release_date,
            series:pokemon_series (
              id,
              name,
              logo
            )
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection card not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching collection card:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collection card' },
        { status: 500 }
      )
    }

    return NextResponse.json(card)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/cards/[id]', operation: 'get_card' }
    })
    console.error('Collection card GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a collection card's metadata
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const data: UpdateCollectionRequest = await request.json()

    // Validate quantity if provided
    if (data.quantity !== undefined && data.quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    // First verify the user owns this collection card
    const { data: existing, error: checkError } = await supabase
      .from('collection_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Collection card not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare update data - only include fields that were provided
    interface UpdateData {
      updated_at: string
      quantity?: number
      condition?: string
      acquisition_price?: number | null
      acquisition_date?: string | null
      notes?: string | null
      variant?: string
      variant_pattern?: string | null
    }

    const updateData: UpdateData = {
      updated_at: new Date().toISOString()
    }

    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.condition !== undefined) updateData.condition = data.condition
    if (data.acquisition_price !== undefined) updateData.acquisition_price = data.acquisition_price
    if (data.acquisition_date !== undefined) updateData.acquisition_date = data.acquisition_date
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.variant !== undefined) updateData.variant = data.variant

    // Validate variant_pattern if provided
    if (data.variant_pattern !== undefined) {
      try {
        updateData.variant_pattern = validateVariantPattern(data.variant_pattern)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Invalid variant pattern' },
          { status: 400 }
        )
      }
    }

    // Update the collection card
    const { data: updated, error: updateError } = await supabase
      .from('collection_cards')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        pokemon_card:pokemon_cards (
          id,
          name,
          local_id,
          rarity,
          image,
          category,
          illustrator,
          tcgplayer_image_url,
          variant_normal,
          variant_holo,
          variant_reverse,
          variant_first_edition,
          variant_poke_ball,
          variant_master_ball,
          set:pokemon_sets (
            id,
            name,
            logo,
            symbol,
            release_date,
            series:pokemon_series (
              id,
              name,
              logo
            )
          )
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating collection card:', updateError)
      return NextResponse.json(
        { error: 'Failed to update collection card' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Collection card updated successfully'
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/cards/[id]', operation: 'update_card' }
    })
    console.error('Collection card PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a card from collection
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = getServerSupabaseClient()

    // Delete the collection card (will fail if user doesn't own it due to RLS)
    const { error: deleteError } = await supabase
      .from('collection_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection card not found or access denied' },
          { status: 404 }
        )
      }
      console.error('Error deleting collection card:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete collection card' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Card removed from collection'
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/cards/[id]', operation: 'delete_card' }
    })
    console.error('Collection card DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}