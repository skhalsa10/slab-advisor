/**
 * Profile Service
 *
 * Server-side helpers for profile operations
 */

import { createClient } from '@supabase/supabase-js'
import type { CreateProfileResult, Profile } from '@/types/profile'
import type { Database } from '@/models/database'

/**
 * Creates a Supabase client for server-side operations
 */
function getSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Creates a user profile with username
 *
 * @param userId - The user's unique identifier
 * @param username - The desired username
 * @returns Profile creation result
 * @throws Error if profile creation fails
 */
export async function createProfile(
  userId: string,
  username: string
): Promise<CreateProfileResult> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('create_user_profile', {
    p_user_id: userId,
    p_username: username.trim().toLowerCase(),
  })

  if (error) {
    console.error('Error creating profile:', error)
    throw error
  }

  if (!data) {
    throw new Error('No data returned from create_user_profile')
  }

  const result = data as unknown as CreateProfileResult

  if (!result.success) {
    throw new Error(result.error || 'Failed to create profile')
  }

  return result
}

/**
 * Gets a user's profile by user_id
 *
 * @param userId - The user's unique identifier
 * @returns Profile or null if not found
 */
export async function getProfileByUserId(
  userId: string
): Promise<Profile | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // User has no profile yet (expected for new users)
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}

/**
 * Gets a user's profile by username
 *
 * @param username - The username to look up
 * @returns Profile or null if not found
 */
export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username.toLowerCase())
    .single()

  if (error) {
    // Username not found (expected)
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching profile by username:', error)
    throw error
  }

  return data
}

/**
 * Checks if a username is available
 *
 * @param username - The username to check
 * @returns True if available, false if taken
 */
export async function checkUsernameAvailable(
  username: string
): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc('check_username_available', {
    p_username: username,
  })

  if (error) {
    console.error('Error checking username availability:', error)
    throw error
  }

  return data
}

/**
 * Gets the show_grading_tips preference for a user
 *
 * @param userId - The user's unique identifier
 * @returns Whether to show grading tips (defaults to true if no profile)
 */
export async function getShowGradingTips(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('show_grading_tips')
    .eq('user_id', userId)
    .single()

  if (error) {
    // User has no profile yet - default to showing tips
    if (error.code === 'PGRST116') {
      return true
    }
    console.error('Error fetching grading tips preference:', error)
    return true // Default to showing tips on error
  }

  return data?.show_grading_tips ?? true
}
