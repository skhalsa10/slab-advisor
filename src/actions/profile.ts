'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'

/**
 * Checks if the authenticated user has a profile (username) set up.
 * Used by the OAuth callback flow to determine routing.
 * User identity is derived from the server-side session, never from caller input.
 * All database operations run server-side only.
 *
 * @returns true if profile exists, false otherwise
 */
export async function checkProfileExists(): Promise<boolean> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return false
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return !!profile
  } catch {
    return false
  }
}
