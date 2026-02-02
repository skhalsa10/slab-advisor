/**
 * Next.js Middleware
 *
 * Security: Server-side authentication, profile enforcement, and waitlist gating
 * Runs on all requests to non-static, non-API routes
 *
 * Waitlist mode (NEXT_PUBLIC_LAUNCH_MODE === 'waitlist'):
 * - Blocks all routes except '/' for public visitors
 * - Allows full access for users with a valid bypass cookie
 * - Bypass cookie is set via secret URL parameter, validated with HMAC
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  isWaitlistMode,
  generateBypassToken,
  validateBypassToken,
  BYPASS_COOKIE_NAME,
  BYPASS_COOKIE_MAX_AGE,
} from '@/lib/waitlist'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ========== WAITLIST GATING (runs before Supabase auth for performance) ==========
  if (isWaitlistMode()) {
    // Step 1: Check for bypass token in URL query parameter
    const bypassParam = request.nextUrl.searchParams.get('bypass')
    if (bypassParam && bypassParam === process.env.WAITLIST_BYPASS_SECRET) {
      // Valid bypass secret: set HMAC-signed cookie and redirect to /auth
      const token = await generateBypassToken()
      const response = NextResponse.redirect(new URL('/auth', request.url))
      response.cookies.set(BYPASS_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: BYPASS_COOKIE_MAX_AGE,
        path: '/',
      })
      return response
    }

    // Step 2: Check for existing bypass cookie
    const bypassCookie = request.cookies.get(BYPASS_COOKIE_NAME)
    const hasBypass = bypassCookie ? await validateBypassToken(bypassCookie.value) : false

    // Step 3: If no valid bypass, lock down everything except root
    if (!hasBypass) {
      if (pathname !== '/') {
        return NextResponse.redirect(new URL('/', request.url))
      }
      // Allow root to render (WaitlistPage component will be shown)
      return NextResponse.next({ request })
    }

    // Has valid bypass: fall through to normal auth logic below
  }

  // ========== STANDARD AUTH LOGIC ==========
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected paths that require authentication
  const protectedPaths = ['/dashboard', '/collection', '/account', '/explore']
  const isProtectedPath = protectedPaths.some(path =>
    pathname.startsWith(path)
  )

  // Security: Check authentication for protected paths
  if (isProtectedPath) {
    if (!user) {
      // Not authenticated, redirect to login with return URL
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Security: Server-side profile check (prevents client-side bypass)
    // Exception: Don't check profile for complete-profile page itself
    if (pathname !== '/auth/complete-profile') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        // User doesn't have profile, redirect to complete-profile
        return NextResponse.redirect(new URL('/auth/complete-profile', request.url))
      }
    }
  }

  // If user has profile but trying to access complete-profile, redirect to dashboard
  if (user && pathname === '/auth/complete-profile') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profile) {
      // User has profile, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
