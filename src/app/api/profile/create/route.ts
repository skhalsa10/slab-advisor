/**
 * Profile Creation API
 *
 * POST /api/profile/create
 *
 * Creates a profile for the authenticated user
 * Requires authentication
 * Security: Pre-checks, input validation, sanitization, length limits
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { validateUsernameFormat } from '@/utils/usernameValidation'
import { checkRateLimit } from '@/middleware/rateLimit'
import type { CreateProfileResult } from '@/types/profile'

// Security: Maximum request body size (1KB is plenty for a username)
const MAX_BODY_SIZE = 1024
const MAX_USERNAME_LENGTH = 100 // Buffer beyond database limit for early rejection

export async function POST(request: NextRequest) {
  try {
    // Security: Rate limiting - 5 profile creation attempts per hour per IP
    const rateLimitResponse = await checkRateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Security: Check content length before parsing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Request too large',
          error_code: 'PAYLOAD_TOO_LARGE',
        },
        { status: 413 }
      )
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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', error_code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Security: Check if user already has a profile FIRST (prevents abuse/DoS)
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing profile:', checkError)
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to create profile',
          error_code: 'CREATION_FAILED',
        },
        { status: 500 }
      )
    }

    if (existingProfile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to create profile',
          error_code: 'CREATION_FAILED',
        },
        { status: 400 }
      )
    }

    // Validate input type and presence
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Username is required',
          error_code: 'INVALID_INPUT',
        },
        { status: 400 }
      )
    }

    // Security: Explicit length check before validation (prevents oversized input)
    if (username.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username exceeds maximum length',
          error_code: 'TOO_LONG',
        },
        { status: 400 }
      )
    }

    // Client-side validation (backup to database validation)
    const validation = validateUsernameFormat(username)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          error_code: 'INVALID_FORMAT',
        },
        { status: 400 }
      )
    }

    // Security: Sanitize username to prevent any potential injection
    const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')

    // Verify sanitization didn't break the username
    if (sanitizedUsername !== username.trim().toLowerCase()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Username contains invalid characters',
          error_code: 'INVALID_FORMAT',
        },
        { status: 400 }
      )
    }

    // Create profile via database function
    const { data, error } = await Sentry.startSpan(
      {
        op: 'db.query',
        name: 'DB: Create Profile',
        attributes: { 'db.system': 'supabase', 'db.operation': 'rpc' }
      },
      async () => supabase.rpc('create_user_profile', {
        p_user_id: user.id,
        p_username: sanitizedUsername,
      })
    )

    if (error) {
      console.error('Error creating profile:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to create profile',
          error_code: 'CREATION_FAILED',
        },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to create profile',
          error_code: 'CREATION_FAILED',
        },
        { status: 500 }
      )
    }

    // Parse the JSONB response from database function
    const result = data as unknown as CreateProfileResult

    if (!result.success) {
      // Return database validation error
      return NextResponse.json(result, { status: 400 })
    }

    // Success
    return NextResponse.json(result)
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'profile/create', operation: 'create_profile' }
    })
    console.error('Profile creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}
