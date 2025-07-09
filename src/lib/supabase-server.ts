import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { User } from '@supabase/supabase-js'

// Type for the session response
export interface SessionResponse {
  user: User | null
  error: string | null
  supabase: SupabaseClient | null
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Private function - only used internally by getServerSession
async function createServerSupabaseClient() {
  // Note: cookies() is called to maintain Next.js compatibility but not used
  // since we're using service role key for server operations
  await cookies()
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  })
}

export async function getServerSession(request: NextRequest): Promise<SessionResponse> {
  const supabase = await createServerSupabaseClient()
  
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