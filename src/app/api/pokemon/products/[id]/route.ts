import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = parseInt(id, 10)

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const supabase = getServerSupabaseClient()

    // Fetch product with set info
    const { data: product, error: productError } = await supabase
      .from('pokemon_products')
      .select(`
        *,
        pokemon_sets(id, name, logo, symbol)
      `)
      .eq('id', productId)
      .single()

    if (productError || !product) {
      console.error('Error fetching product:', productError)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch latest price from view
    const { data: latestPrice, error: priceError } = await supabase
      .from('pokemon_product_latest_prices')
      .select('market_price, low_price, mid_price, high_price, price_date')
      .eq('pokemon_product_id', productId)
      .single()

    if (priceError && priceError.code !== 'PGRST116') {
      console.error('Error fetching latest price:', priceError)
    }

    // Fetch 90-day price history
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: priceHistory, error: historyError } = await supabase
      .from('pokemon_product_price_history')
      .select('price_date, market_price, low_price, mid_price, high_price')
      .eq('pokemon_product_id', productId)
      .gte('price_date', ninetyDaysAgo.toISOString().split('T')[0])
      .order('price_date', { ascending: true })

    if (historyError) {
      console.error('Error fetching price history:', historyError)
    }

    return NextResponse.json({
      ...product,
      current_price: latestPrice || null,
      price_history: priceHistory || []
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'pokemon/products/[id]', operation: 'get_product' }
    })
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
