import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-server'

interface AddToCollectionRequest {
  mode: 'known-card' | 'manual-entry'
  pokemon_card_id?: string
  variant: string
  quantity: number
  condition?: string
  acquisition_price?: number
  acquisition_date?: string
  notes?: string
  // Manual card fields (only used when mode === 'manual-entry')
  manual_card_name?: string
  manual_set_name?: string
  manual_card_number?: string
  manual_rarity?: string
  manual_series?: string
  manual_year?: number
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

    if (data.mode === 'known-card') {
      if (!data.pokemon_card_id) {
        return NextResponse.json(
          { error: 'Pokemon card ID required for known cards' },
          { status: 400 }
        )
      }

      // Check if user already has this card + variant combination
      const { data: existing, error: checkError } = await supabase
        .from('collection_cards')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('pokemon_card_id', data.pokemon_card_id)
        .eq('variant', data.variant)
        .single()

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
      } else {
        // Create new entry for known card (clean data - no manual fields)
        const cleanData = {
          user_id: user.id,
          card_type: 'pokemon',
          pokemon_card_id: data.pokemon_card_id,
          variant: data.variant,
          quantity: data.quantity,
          condition: data.condition || null,
          acquisition_price: data.acquisition_price || null,
          acquisition_date: data.acquisition_date || null,
          notes: data.notes || null
          // Explicitly NOT setting manual_* fields for known cards
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
      }
    } else if (data.mode === 'manual-entry') {
      // Manual entry mode - validate manual fields
      if (!data.manual_card_name) {
        return NextResponse.json(
          { error: 'Card name required for manual entries' },
          { status: 400 }
        )
      }

      // Create new manual entry (clean data - no pokemon_card_id)
      const cleanData = {
        user_id: user.id,
        card_type: 'pokemon',
        pokemon_card_id: null, // No reference for manual cards
        variant: data.variant,
        quantity: data.quantity,
        condition: data.condition || null,
        acquisition_price: data.acquisition_price || null,
        acquisition_date: data.acquisition_date || null,
        notes: data.notes || null,
        manual_card_name: data.manual_card_name,
        manual_set_name: data.manual_set_name || null,
        manual_card_number: data.manual_card_number || null,
        manual_rarity: data.manual_rarity || null,
        manual_series: data.manual_series || null,
        manual_year: data.manual_year || null
      }

      const { data: created, error: createError } = await supabase
        .from('collection_cards')
        .insert(cleanData)
        .select()
        .single()

      if (createError) {
        console.error('Error creating manual collection entry:', createError)
        return NextResponse.json(
          { error: 'Failed to add manual card to collection' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'created',
        data: created,
        message: `Added manual card "${data.manual_card_name}" to collection`
      })
    }

    return NextResponse.json(
      { error: 'Invalid mode specified' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Collection API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check if user has specific card + variant in collection
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

    if (!pokemon_card_id || !variant) {
      return NextResponse.json(
        { error: 'pokemon_card_id and variant are required' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    const { data: existing, error } = await supabase
      .from('collection_cards')
      .select('id, quantity, condition, acquisition_price, acquisition_date, notes')
      .eq('user_id', user.id)
      .eq('pokemon_card_id', pokemon_card_id)
      .eq('variant', variant)
      .single()

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