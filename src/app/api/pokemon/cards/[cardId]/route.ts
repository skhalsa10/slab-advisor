import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  _request: Request,
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

    // Fetch raw price records — no transformation, keep all fields for the component to use
    const { data: prices, error: pricesError } = await supabase
      .from('pokemon_card_prices')
      .select('current_market_price, current_market_price_variant, current_market_price_condition, variant_pattern, raw_price_history, raw_history_variants_tracked')
      .eq('pokemon_card_id', cardId)

    if (pricesError) {
      console.error('Error fetching card prices:', pricesError)
      // Don't fail - continue without prices
    }

    return NextResponse.json({
      ...card,
      pokemon_card_prices: prices || []
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