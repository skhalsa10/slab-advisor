import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getSetOwnedCardIds } from '@/lib/collection-server'

interface RouteContext {
  params: Promise<{ setId: string }>
}

/**
 * GET - Get owned card IDs for a specific set
 *
 * Returns an array of pokemon_card_ids that the authenticated user owns from a set.
 * Handles unauthenticated users gracefully by returning an empty array.
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { setId } = await context.params

    if (!setId) {
      return NextResponse.json(
        { error: 'Set ID is required' },
        { status: 400 }
      )
    }

    const ownedCardIds = await getSetOwnedCardIds(setId)

    return NextResponse.json({ ownedCardIds })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'collection/sets/[setId]/ownership', operation: 'get_owned_cards' }
    })
    console.error('Set owned cards API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
