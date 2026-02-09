import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params

    // Use server-side Supabase client
    const supabase = getServerSupabaseClient()

    // Fetch card with related data
    const { data: card, error } = await supabase
      .from('pokemon_cards')
      .select(`
        *,
        set:pokemon_sets(
          id,
          name,
          series_id,
          series:pokemon_series(id, name)
        )
      `)
      .eq('id', cardId)
      .single()

    if (error) {
      console.error('Error fetching card:', error)
      return NextResponse.json(
        { error: 'Failed to fetch card' },
        { status: 500 }
      )
    }

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    // Fetch prices from pokemon_card_prices table
    const { data: prices, error: pricesError } = await supabase
      .from('pokemon_card_prices')
      .select('current_market_price, current_market_price_condition, variant_pattern')
      .eq('pokemon_card_id', cardId)

    if (pricesError) {
      console.error('Error fetching card prices:', pricesError)
      // Don't fail - continue without prices
    }

    // Transform prices to legacy price_data format
    let priceData: Array<{ subTypeName: string; marketPrice: number; variant_pattern?: string }> | null = null
    if (prices && prices.length > 0) {
      priceData = []
      for (const price of prices) {
        if (price.current_market_price && price.current_market_price > 0) {
          let subTypeName = price.current_market_price_condition || 'Near Mint'
          if (price.variant_pattern === 'poke_ball') {
            subTypeName = `${subTypeName} (Poké Ball)`
          } else if (price.variant_pattern === 'master_ball') {
            subTypeName = `${subTypeName} (Master Ball)`
          }

          priceData.push({
            subTypeName,
            marketPrice: price.current_market_price,
            variant_pattern: price.variant_pattern || undefined
          })
        }
      }
      if (priceData.length === 0) {
        priceData = null
      }
    }

    return NextResponse.json({
      ...card,
      price_data: priceData
    })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'pokemon/cards/[cardId]', operation: 'get_card' }
    })
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}