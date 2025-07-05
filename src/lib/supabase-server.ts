import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false
    }
  })
}

export async function getServerSession(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'No authorization header' }
  }
  
  const token = authHeader.substring(7)
  
  // Verify the JWT token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  return { user, error }
}