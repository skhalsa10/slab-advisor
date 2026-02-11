/**
 * Grading Tips Preference API
 *
 * PATCH /api/profile/grading-tips
 *
 * Updates the show_grading_tips preference for the authenticated user
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { checkRateLimit } from '@/middleware/rateLimit'

export async function PATCH(request: NextRequest) {
  try {
    // Rate limiting - 10 requests per minute
    const rateLimitResponse = await checkRateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10,
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const { showGradingTips } = body

    // Validate input
    if (typeof showGradingTips !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'showGradingTips must be a boolean' },
        { status: 400 }
      )
    }

    // Create Supabase client with cookies for authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update the user settings preference
    const { error: updateError } = await supabase
      .from('user_settings')
      .update({ show_grading_tips: showGradingTips })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating grading tips preference:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'profile/grading-tips', operation: 'update_grading_tips' }
    })
    console.error('Grading tips preference update error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
