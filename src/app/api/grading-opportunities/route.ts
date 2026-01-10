/**
 * API route for fetching grading opportunities
 *
 * GET /api/grading-opportunities?limit=100
 *
 * Returns opportunities for the authenticated user with optional limit.
 * Default limit is 100 to fetch "all" opportunities for carousel mode.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGradingOpportunities } from '@/lib/grading-opportunities-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 100

    const { opportunities, totalCount } = await getGradingOpportunities(limit)

    return NextResponse.json({ opportunities, totalCount })
  } catch (error) {
    console.error('Error fetching grading opportunities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grading opportunities' },
      { status: 500 }
    )
  }
}
