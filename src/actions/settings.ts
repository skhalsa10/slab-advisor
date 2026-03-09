'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'

/**
 * Fetches the theme preference for the authenticated user.
 * User identity is derived from the server-side session, never from caller input.
 * All database operations run server-side only.
 *
 * @returns 'LIGHT' or 'DARK' (defaults to 'LIGHT' if not authenticated or error occurs)
 */
export async function fetchUserTheme(): Promise<'LIGHT' | 'DARK'> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return 'LIGHT'
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('theme')
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user theme:', error)
      return 'LIGHT'
    }

    return (data?.theme as 'LIGHT' | 'DARK') ?? 'LIGHT'
  } catch (err) {
    console.error('Unexpected error in fetchUserTheme:', err)
    return 'LIGHT'
  }
}
