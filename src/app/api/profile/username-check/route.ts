/**
 * Username Availability Check API
 *
 * POST /api/profile/username-check
 *
 * Checks if a username is available (not taken)
 * Security: Requires authentication, rate limiting (prevents enumeration attacks)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateUsernameFormat } from '@/utils/usernameValidation'
import { checkRateLimit } from '@/middleware/rateLimit'

export async function POST(request: NextRequest) {
  try {
    // Security: Rate limiting - 30 username checks per minute per IP
    const rateLimitResponse = await checkRateLimit(request, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { username } = await request.json()

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

    // Security: Require authentication to prevent username enumeration attacks
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { available: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { available: false, error: 'Username is required' },
        { status: 400 }
      )
    }

    // Security: Length check to prevent oversized input
    if (username.length > 100) {
      return NextResponse.json(
        { available: false, error: 'Username too long' },
        { status: 400 }
      )
    }

    // Client-side validation (backup)
    const validation = validateUsernameFormat(username)
    if (!validation.valid) {
      return NextResponse.json(
        { available: false, error: validation.error },
        { status: 400 }
      )
    }

    // Check availability via database function
    const { data, error } = await supabase.rpc('check_username_available', {
      p_username: username,
    })

    if (error) {
      console.error('Error checking username availability:', error)
      return NextResponse.json(
        { available: false, error: 'Failed to check username availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ available: data })
  } catch (error) {
    console.error('Username check error:', error)
    return NextResponse.json(
      { available: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
