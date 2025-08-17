/**
 * Server-side Authentication module for Slab Advisor
 * 
 * This module provides server-side authentication utilities using Supabase Auth.
 * It handles user validation for API routes and server components.
 * 
 * @module auth-server
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

/**
 * Gets the currently authenticated user from server-side context
 * 
 * Retrieves and validates the user session from cookies.
 * This is for use in API routes and server components only.
 * 
 * @returns Current user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   const user = await getUser()
 *   if (!user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   return NextResponse.json({ userId: user.id })
 * }
 * ```
 */
export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    
    // Create a Supabase client with cookie handling for Next.js
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
            try {
              cookiesToSet.forEach(() => {
                // For API routes, we can't set cookies in the response
                // This is expected and should be handled by middleware
              })
            } catch {
              // Cookie set error is expected in API routes
            }
          },
        },
      }
    )
    
    // Get the user from the current session
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting user from server context:', error)
    return null
  }
}