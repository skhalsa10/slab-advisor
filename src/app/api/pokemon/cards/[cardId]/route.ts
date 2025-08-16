import { NextResponse } from 'next/server'
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
    
    return NextResponse.json(card)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}