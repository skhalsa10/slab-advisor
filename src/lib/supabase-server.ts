/**
 * Supabase Server-side module for Slab Advisor
 * 
 * This module provides server-side Supabase client functionality for use in
 * Next.js API routes and server components. It uses the service role key
 * for elevated permissions and handles JWT token validation.
 * 
 * Key features:
 * - Service role client creation for server operations
 * - JWT token validation from Authorization headers
 * - Session management for API routes
 * - Type-safe session response handling
 * 
 * @module supabase-server
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { User } from '@supabase/supabase-js'

/**
 * Response type for server session validation
 */
export interface SessionResponse {
  user: User | null
  error: string | null
  supabase: SupabaseClient | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Creates a Supabase client with service role permissions
 * 
 * This is a private function used internally by getServerSession.
 * Uses service role key for elevated database permissions.
 * 
 * @private
 * @returns Supabase client with service role access
 */
function createServerSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  })
}

/**
 * Validates user session from Next.js request
 * 
 * Extracts and validates JWT token from Authorization header,
 * then returns user information and Supabase client for further operations.
 * 
 * @param request - Next.js request object containing headers
 * @returns Promise containing session response with user, error, and client
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const { user, error, supabase } = await getServerSession(request)
 *   
 *   if (error || !user) {
 *     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 *   }
 *   
 *   // Use supabase client for database operations
 *   const { data } = await supabase.from('user_data').select('*')
 *   return NextResponse.json(data)
 * }
 * ```
 */


/**
 * Creates a public Supabase client for server-side operations
 * 
 * This function provides access to a Supabase client with service role permissions
 * for use in Server Components and API routes where no user authentication is needed.
 * Perfect for public data fetching operations.
 * 
 * @returns Supabase client with service role access
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent() {
 *   const supabase = getServerSupabaseClient()
 *   const { data } = await supabase.from('public_data').select('*')
 *   return <div>{JSON.stringify(data)}</div>
 * }
 * ```
 */
export function getServerSupabaseClient() {
  return createServerSupabaseClient()
}

/**
 * Creates an authenticated Supabase client for server-side operations
 * 
 * This client respects Row Level Security (RLS) policies and validates
 * the user session from cookies. Use this for any user-specific data
 * operations where you want to ensure users can only access their own data.
 * 
 * @returns Promise containing authenticated Supabase client that respects RLS
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent() {
 *   const supabase = await getAuthenticatedSupabaseClient()
 *   const { data } = await supabase
 *     .from('collection_cards')
 *     .select('*')
 *     // Will only return cards for the authenticated user due to RLS
 *   return <div>{data?.length} cards found</div>
 * }
 * ```
 */
export async function getAuthenticatedSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
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
}

export async function getServerSession(request: NextRequest): Promise<SessionResponse> {
  // Note: This function still needs cookies for session validation
  await cookies()
  const supabase = createServerSupabaseClient()
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header', supabase: null }
  }
  
  const token = authHeader.substring(7)
  
  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  // Return the supabase client for reuse
  return { 
    user, 
    error: error?.message || null, 
    supabase: error ? null : supabase 
  }
}