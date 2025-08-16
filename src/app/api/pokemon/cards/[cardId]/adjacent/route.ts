import { NextResponse } from 'next/server'
import { getServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const { searchParams } = new URL(request.url)
    const setId = searchParams.get('setId')
    
    if (!setId) {
      return NextResponse.json(
        { error: 'setId is required' },
        { status: 400 }
      )
    }
    
    // Use server-side Supabase client
    const supabase = getServerSupabaseClient()
    
    // Get the current card's local_id
    const { data: currentCard, error: currentError } = await supabase
      .from('pokemon_cards')
      .select('local_id')
      .eq('id', cardId)
      .single()
    
    if (currentError || !currentCard) {
      return NextResponse.json(
        { error: 'Current card not found' },
        { status: 404 }
      )
    }
    
    const currentLocalId = parseInt(currentCard.local_id || '0')
    
    // Get previous card
    const { data: prevCard } = await supabase
      .from('pokemon_cards')
      .select('id, name, local_id')
      .eq('set_id', setId)
      .lt('local_id', currentLocalId)
      .order('local_id', { ascending: false })
      .limit(1)
      .single()
    
    // Get next card
    const { data: nextCard } = await supabase
      .from('pokemon_cards')
      .select('id, name, local_id')
      .eq('set_id', setId)
      .gt('local_id', currentLocalId)
      .order('local_id', { ascending: true })
      .limit(1)
      .single()
    
    return NextResponse.json({
      previous: prevCard || null,
      next: nextCard || null
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}