import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication and get Supabase client
    const { user, error: authError, supabase } = await getServerSession(request)
    
    if (authError || !user || !supabase) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Validate request body
    const { cardId, cardDetails } = await request.json()
    if (!cardId || typeof cardId !== 'string') {
      return NextResponse.json({ error: 'Valid card ID is required' }, { status: 400 })
    }

    // 3. Verify card ownership
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, user_id')
      .eq('id', cardId)
      .eq('user_id', user.id) // Ensure user owns this card
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    // 4. Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Add card identification fields if provided
    if (cardDetails.full_name !== undefined) updateData.card_title = cardDetails.full_name
    if (cardDetails.card_set !== undefined) updateData.card_set = cardDetails.card_set
    if (cardDetails.rarity !== undefined) updateData.rarity = cardDetails.rarity
    if (cardDetails.out_of !== undefined) updateData.out_of = cardDetails.out_of
    if (cardDetails.card_number !== undefined) updateData.card_number = cardDetails.card_number
    if (cardDetails.set_series_code !== undefined) updateData.set_series_code = cardDetails.set_series_code
    if (cardDetails.set_code !== undefined) updateData.set_code = cardDetails.set_code
    if (cardDetails.series !== undefined) updateData.series = cardDetails.series
    if (cardDetails.year !== undefined) updateData.year = cardDetails.year
    if (cardDetails.subcategory !== undefined) updateData.subcategory = cardDetails.subcategory
    if (cardDetails.links !== undefined) updateData.links = cardDetails.links

    // 5. Update card record
    const { error: updateError } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update card details' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      cardId
    })

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error during card update',
      success: false 
    }, { status: 500 })
  }
}