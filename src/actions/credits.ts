'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'

/**
 * Fetches the credit balance for the authenticated user.
 * User identity is derived from the server-side session, never from caller input.
 * All database operations run server-side only.
 *
 * @returns Number of credits remaining (0 if not authenticated or error occurs)
 */
export async function fetchUserCredits(): Promise<number> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return 0
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user credits:', error)
      return 0
    }

    return data?.credits_remaining ?? 0
  } catch (err) {
    console.error('Unexpected error in fetchUserCredits:', err)
    return 0
  }
}
