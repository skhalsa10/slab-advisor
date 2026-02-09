import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getServerSupabaseClient } from '@/lib/supabase-server'
import { getUser } from '@/lib/auth-server'
import { ALLOWED_PRODUCT_CONDITIONS } from '@/constants/products'

interface UpdateProductRequest {
  quantity?: number
  condition?: string
  purchase_price?: number | null
  purchased_at?: string | null
  notes?: string | null
}

/**
 * Validates condition value against allowed list
 */
function validateCondition(condition: string | null | undefined): string | null {
  if (condition === null || condition === undefined || condition === '') {
    return null
  }

  if (ALLOWED_PRODUCT_CONDITIONS.includes(condition as typeof ALLOWED_PRODUCT_CONDITIONS[number])) {
    return condition
  }

  throw new Error(
    `Invalid condition: ${condition}. Allowed values: ${ALLOWED_PRODUCT_CONDITIONS.join(', ')}`
  )
}

/**
 * GET - Fetch a single collection product with joined Pokemon product data
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

    // Step 1: Fetch collection product with joined Pokemon product data (no view join)
    // Supabase can't auto-join views, so we fetch prices separately
    const { data: product, error } = await supabase
      .from('collection_products')
      .select(`
        *,
        pokemon_product:pokemon_products (
          id,
          name,
          tcgplayer_image_url,
          tcgplayer_product_id,
          pokemon_set:pokemon_sets (
            id,
            name,
            logo
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection product not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching collection product:', error)
      return NextResponse.json(
        { error: 'Failed to fetch collection product' },
        { status: 500 }
      )
    }

    // Step 2: Fetch price separately from the view
    let latestPrice = null
    if (product.pokemon_product?.id) {
      const { data: priceData } = await supabase
        .from('pokemon_product_latest_prices')
        .select('market_price, price_date')
        .eq('pokemon_product_id', product.pokemon_product.id)
        .single()

      latestPrice = priceData ? [priceData] : null
    }

    // Step 3: Merge and return
    return NextResponse.json({ ...product, latest_price: latestPrice })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/products/[id]', operation: 'get_product' }
    })
    console.error('Collection product GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a collection product's metadata
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

    const data: UpdateProductRequest = await request.json()

    // Validate quantity if provided
    if (data.quantity !== undefined && data.quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    // First verify the user owns this collection product
    const { data: existing, error: checkError } = await supabase
      .from('collection_products')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Collection product not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare update data - only include fields that were provided
    interface UpdateData {
      updated_at: string
      quantity?: number
      condition?: string | null
      purchase_price?: number | null
      purchased_at?: string | null
      notes?: string | null
    }

    const updateData: UpdateData = {
      updated_at: new Date().toISOString()
    }

    if (data.quantity !== undefined) updateData.quantity = data.quantity
    if (data.purchase_price !== undefined) updateData.purchase_price = data.purchase_price
    if (data.purchased_at !== undefined) updateData.purchased_at = data.purchased_at
    if (data.notes !== undefined) updateData.notes = data.notes

    // Validate condition if provided
    if (data.condition !== undefined) {
      try {
        updateData.condition = validateCondition(data.condition)
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Invalid condition' },
          { status: 400 }
        )
      }
    }

    // Update the collection product (no view join - Supabase can't auto-join views)
    const { data: updated, error: updateError } = await supabase
      .from('collection_products')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        pokemon_product:pokemon_products (
          id,
          name,
          tcgplayer_image_url,
          tcgplayer_product_id,
          pokemon_set:pokemon_sets (
            id,
            name,
            logo
          )
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating collection product:', updateError)
      return NextResponse.json(
        { error: 'Failed to update collection product' },
        { status: 500 }
      )
    }

    // Fetch price separately from the view
    let latestPrice = null
    if (updated.pokemon_product?.id) {
      const { data: priceData } = await supabase
        .from('pokemon_product_latest_prices')
        .select('market_price, price_date')
        .eq('pokemon_product_id', updated.pokemon_product.id)
        .single()

      latestPrice = priceData ? [priceData] : null
    }

    return NextResponse.json({
      success: true,
      data: { ...updated, latest_price: latestPrice },
      message: 'Collection product updated successfully'
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/products/[id]', operation: 'update_product' }
    })
    console.error('Collection product PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove a product from collection
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

    // Delete the collection product (will fail if user doesn't own it due to RLS)
    const { error: deleteError } = await supabase
      .from('collection_products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Collection product not found or access denied' },
          { status: 404 }
        )
      }
      console.error('Error deleting collection product:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete collection product' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product removed from collection'
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/products/[id]', operation: 'delete_product' }
    })
    console.error('Collection product DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
