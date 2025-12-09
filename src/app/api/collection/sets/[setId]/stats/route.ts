import { NextResponse } from 'next/server'
import { getSetOwnershipStats } from '@/lib/collection-server'

interface RouteContext {
  params: Promise<{ setId: string }>
}

/**
 * GET - Get ownership statistics for a specific set
 *
 * Returns the count of unique cards the authenticated user owns from a set.
 * Handles unauthenticated users gracefully by returning 0.
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

    const stats = await getSetOwnershipStats(setId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Set ownership stats API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
