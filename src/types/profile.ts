/**
 * Profile Types for Slab Advisor
 *
 * Application-specific types for profile operations
 * (Database types are auto-generated in src/models/database.ts)
 */

import type { Tables } from '@/models/database'

// Re-export the Profile type from database
export type Profile = Tables<'profiles'>

// Result from create_user_profile database function
export interface CreateProfileResult {
  success: boolean
  profile_id?: string
  username?: string
  error?: string
  error_code?:
    | 'INVALID_FORMAT'
    | 'TOO_SHORT'
    | 'TOO_LONG'
    | 'RESERVED_USERNAME'
    | 'USERNAME_TAKEN'
    | 'PROFILE_EXISTS'
    | 'USER_NOT_FOUND'
    | 'DATABASE_ERROR'
}

// Result from username availability check API
export interface UsernameCheckResult {
  available: boolean
  error?: string
}
