/**
 * Profile Service
 *
 * Server-side helpers for profile operations
 */

import type { CreateProfileResult, Profile } from '@/types/profile'
import { getServerSupabaseClient } from '@/lib/supabase-server'

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
  const supabase = getServerSupabaseClient()

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
  const supabase = getServerSupabaseClient()

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
  const supabase = getServerSupabaseClient()

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
  const supabase = getServerSupabaseClient()

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
 * User settings with defaults
 */
export interface UserSettings {
  show_grading_tips: boolean
  subscription_tier: 'free' | 'pro'
}

/**
 * Gets all user settings for a user
 *
 * @param userId - The user's unique identifier
 * @returns User settings with defaults applied
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const supabase = getServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('show_grading_tips, subscription_tier')
    .eq('user_id', userId)
    .single()

  if (error) {
    // User has no settings yet - return defaults
    if (error.code === 'PGRST116') {
      return { show_grading_tips: true, subscription_tier: 'free' }
    }
    console.error('Error fetching user settings:', error)
    return { show_grading_tips: true, subscription_tier: 'free' }
  }

  return {
    show_grading_tips: data?.show_grading_tips ?? true,
    subscription_tier: (data?.subscription_tier as 'free' | 'pro') ?? 'free',
  }
}

/**
 * Gets the show_grading_tips preference for a user
 *
 * @param userId - The user's unique identifier
 * @returns Whether to show grading tips (defaults to true if no settings)
 */
export async function getShowGradingTips(userId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('show_grading_tips')
    .eq('user_id', userId)
    .single()

  if (error) {
    // User has no settings yet - default to showing tips
    if (error.code === 'PGRST116') {
      return true
    }
    console.error('Error fetching grading tips preference:', error)
    return true // Default to showing tips on error
  }

  return data?.show_grading_tips ?? true
}
