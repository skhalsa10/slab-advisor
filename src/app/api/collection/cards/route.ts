import { NextResponse } from 'next/server'
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

interface AddToCollectionRequest {
  pokemon_card_id: string
  variant: string
  variant_pattern?: string | null
  quantity: number
  condition?: string
  acquisition_price?: number
  acquisition_date?: string
  notes?: string
}

// CollectionCard interface removed - not needed for this API

/**
 * POST - Add card to collection or update existing quantity
 */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const data: AddToCollectionRequest = await request.json()

    // Validate required fields
    if (!data.variant || !data.quantity || data.quantity < 1) {
      return NextResponse.json(
        { error: 'Variant and quantity are required' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    // Check if user already has this card + variant + pattern combination
    let query = supabase
      .from('collection_cards')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('pokemon_card_id', data.pokemon_card_id)
      .eq('variant', data.variant)

    // Match on variant_pattern too (null matches null)
    if (data.variant_pattern) {
      query = query.eq('variant_pattern', data.variant_pattern)
    } else {
      query = query.is('variant_pattern', null)
    }

    const { data: existing, error: checkError } = await query.single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing collection:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing collection' },
        { status: 500 }
      )
    }

    if (existing) {
      // Update existing entry - add to quantity
      const { data: updated, error: updateError } = await supabase
        .from('collection_cards')
        .update({
          quantity: existing.quantity + data.quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating collection quantity:', updateError)
        return NextResponse.json(
          { error: 'Failed to update collection' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'updated',
        data: updated,
        message: `Added ${data.quantity} more. Total: ${updated.quantity}`
      })
    }

    // Validate variant_pattern before insertion
    let validatedPattern: string | null
    try {
      validatedPattern = validateVariantPattern(data.variant_pattern)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid variant pattern' },
        { status: 400 }
      )
    }

    // Create new collection entry
    const cleanData = {
      user_id: user.id,
      card_type: 'pokemon',
      pokemon_card_id: data.pokemon_card_id,
      variant: data.variant,
      variant_pattern: validatedPattern,
      quantity: data.quantity,
      condition: data.condition || null,
      acquisition_price: data.acquisition_price || null,
      acquisition_date: data.acquisition_date || null,
      notes: data.notes || null
    }

    const { data: created, error: createError } = await supabase
      .from('collection_cards')
      .insert(cleanData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating collection entry:', createError)
      return NextResponse.json(
        { error: 'Failed to add to collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      action: 'created',
      data: created,
      message: `Added ${data.quantity} card(s) to collection`
    })
  } catch (error) {
    console.error('Collection API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check if user has specific card + variant + pattern in collection
 */
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const pokemon_card_id = searchParams.get('pokemon_card_id')
    const variant = searchParams.get('variant')
    const variant_pattern = searchParams.get('variant_pattern')

    if (!pokemon_card_id || !variant) {
      return NextResponse.json(
        { error: 'pokemon_card_id and variant are required' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    // Build query with variant_pattern support (same logic as POST)
    let query = supabase
      .from('collection_cards')
      .select('id, quantity, condition, acquisition_price, acquisition_date, notes, variant_pattern')
      .eq('user_id', user.id)
      .eq('pokemon_card_id', pokemon_card_id)
      .eq('variant', variant)

    // Match on variant_pattern too (null matches null)
    if (variant_pattern) {
      query = query.eq('variant_pattern', variant_pattern)
    } else {
      query = query.is('variant_pattern', null)
    }

    const { data: existing, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking collection:', error)
      return NextResponse.json(
        { error: 'Failed to check collection' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      exists: !!existing,
      data: existing || null
    })
  } catch (error) {
    console.error('Collection check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}