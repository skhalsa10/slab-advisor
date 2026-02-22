'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'

/**
 * Checks if a user has a profile (username) set up.
 * Used by the OAuth callback flow to determine routing.
 * All database operations run server-side only.
 *
 * @param userId - The user's unique identifier
 * @returns true if profile exists, false otherwise
 */
export async function checkProfileExists(userId: string): Promise<boolean> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .single()

    return !!profile
  } catch {
    return false
  }
}
