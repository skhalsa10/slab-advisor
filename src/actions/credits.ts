'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'

/**
 * Fetches the credit balance for the authenticated user.
 * All database operations run server-side only.
 *
 * @param userId - The user's unique identifier
 * @returns Number of credits remaining (0 if error occurs)
 */
export async function fetchUserCredits(userId: string): Promise<number> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user credits:', error)
      return 0
    }

    return data?.credits_remaining || 0
  } catch (err) {
    console.error('Unexpected error in fetchUserCredits:', err)
    return 0
  }
}
