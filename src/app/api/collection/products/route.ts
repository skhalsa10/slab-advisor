import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-server'

// Allowed condition values - must match database CHECK constraint
const ALLOWED_CONDITIONS = ['sealed', 'opened', 'damaged'] as const

/**
 * Validates condition value against allowed list
 */
function validateCondition(condition: string | null | undefined): string {
  if (!condition) {
    return 'sealed' // Default to sealed
  }

  if (ALLOWED_CONDITIONS.includes(condition as typeof ALLOWED_CONDITIONS[number])) {
    return condition
  }

  throw new Error(`Invalid condition: ${condition}. Allowed values: ${ALLOWED_CONDITIONS.join(', ')}`)
}

interface AddProductToCollectionRequest {
  pokemon_product_id: number
  quantity: number
  condition?: string
  purchase_price?: number
  purchased_at?: string
  notes?: string
}

/**
 * POST - Add product to collection or update existing quantity
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

    const data: AddProductToCollectionRequest = await request.json()

    // Validate required fields
    if (!data.pokemon_product_id || !data.quantity || data.quantity < 1) {
      return NextResponse.json(
        { error: 'Product ID and quantity (minimum 1) are required' },
        { status: 400 }
      )
    }

    // Validate condition
    let validatedCondition: string
    try {
      validatedCondition = validateCondition(data.condition)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid condition' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    // Verify the product exists
    const { data: product, error: productError } = await supabase
      .from('pokemon_products')
      .select('id, name')
      .eq('id', data.pokemon_product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user already has this product in their collection
    const { data: existing, error: checkError } = await supabase
      .from('collection_products')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('pokemon_product_id', data.pokemon_product_id)
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
        .from('collection_products')
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

    // Create new entry
    const cleanData = {
      user_id: user.id,
      pokemon_product_id: data.pokemon_product_id,
      quantity: data.quantity,
      condition: validatedCondition,
      purchase_price: data.purchase_price || null,
      purchased_at: data.purchased_at || null,
      notes: data.notes || null
    }

    const { data: created, error: createError } = await supabase
      .from('collection_products')
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
      message: `Added ${data.quantity} product(s) to collection`
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/products', operation: 'add_product' }
    })
    console.error('Collection products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check if user has specific product in collection
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
    const pokemon_product_id = searchParams.get('pokemon_product_id')

    if (!pokemon_product_id) {
      return NextResponse.json(
        { error: 'pokemon_product_id is required' },
        { status: 400 }
      )
    }

    const productId = parseInt(pokemon_product_id, 10)
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid pokemon_product_id' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    const { data: existing, error } = await supabase
      .from('collection_products')
      .select('id, quantity, condition, purchase_price, purchased_at, notes')
      .eq('user_id', user.id)
      .eq('pokemon_product_id', productId)
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
    Sentry.captureException(error, {
      tags: { api: 'collection/products', operation: 'check_product' }
    })
    console.error('Collection check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
