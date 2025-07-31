/**
 * Authentication module for Slab Advisor
 * 
 * This module provides authentication utilities using Supabase Auth.
 * It handles user registration, login, logout, and credit management.
 * 
 * @module auth
 */

import { supabase } from './supabase'
import type { User, Provider } from '@supabase/supabase-js'

/**
 * Signs up a new user with email and password
 * 
 * Creates a new user account and initializes their credit balance with 2 free credits.
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Authentication data including user and session
 * @throws Supabase auth error if signup fails
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await signUp('user@example.com', 'password123')
 *   console.log('User created:', data.user)
 * } catch (error) {
 *   console.error('Signup failed:', error)
 * }
 * ```
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  
  // Create user credits record
  if (data.user) {
    const { error: creditsError } = await supabase
      .from('user_credits')
      .insert({
        user_id: data.user.id,
        credits_remaining: 2, // Free tier: 2 credits
        total_credits_purchased: 0
      })
    
    if (creditsError) {
      console.error('Error creating user credits:', creditsError)
    }
  }
  
  return data
}

/**
 * Signs in an existing user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Authentication data including user and session
 * @throws Supabase auth error if login fails
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await signIn('user@example.com', 'password123')
 *   console.log('User logged in:', data.user)
 * } catch (error) {
 *   console.error('Login failed:', error)
 * }
 * ```
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

/**
 * Signs out the current user
 * 
 * Clears the session and logs out the user from all devices.
 * 
 * @throws Supabase auth error if logout fails
 * 
 * @example
 * ```typescript
 * try {
 *   await signOut()
 *   console.log('User logged out successfully')
 * } catch (error) {
 *   console.error('Logout failed:', error)
 * }
 * ```
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Gets the currently authenticated user
 * 
 * Retrieves the user from the current session if authenticated.
 * 
 * @returns Current user object or null if not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser()
 * if (user) {
 *   console.log('Current user:', user.email)
 * } else {
 *   console.log('No user logged in')
 * }
 * ```
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Gets the credit balance for a specific user
 * 
 * Retrieves the number of credits remaining for the user.
 * If no credit record exists, creates one with 2 free credits.
 * 
 * @param userId - The user's unique identifier
 * @returns Number of credits remaining (0 if error occurs)
 * 
 * @example
 * ```typescript
 * const credits = await getUserCredits('user-id-123')
 * console.log(`User has ${credits} credits remaining`)
 * ```
 */
export async function getUserCredits(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      console.error('Error fetching user credits:', error)
      // If no credits record exists, create one
      if (error.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            credits_remaining: 2,
            total_credits_purchased: 0
          })
        
        if (insertError) {
          console.error('Error creating user credits:', insertError)
          return 0
        }
        return 2
      }
      return 0
    }
    
    return data?.credits_remaining || 0
  } catch (err) {
    console.error('Unexpected error in getUserCredits:', err)
    return 0
  }
}

/**
 * Deducts one credit from a user's balance
 * 
 * Uses a Supabase RPC function to atomically deduct a credit.
 * This ensures thread-safe credit deduction.
 * 
 * @param userId - The user's unique identifier
 * @throws Error if credit deduction fails (e.g., insufficient credits)
 * 
 * @example
 * ```typescript
 * try {
 *   await deductCredit('user-id-123')
 *   console.log('Credit deducted successfully')
 * } catch (error) {
 *   console.error('Failed to deduct credit:', error)
 * }
 * ```
 */
export async function deductCredit(userId: string) {
  const { error } = await supabase.rpc('deduct_user_credit', {
    user_id: userId
  })
  
  if (error) throw error
}

/**
 * Signs in a user using an OAuth provider
 * 
 * Initiates OAuth authentication flow with the specified provider.
 * Redirects to the provider's login page and back to the callback URL.
 * 
 * @param provider - OAuth provider (e.g., 'google', 'github', 'facebook')
 * @returns OAuth data including redirect URL
 * @throws Error if OAuth initialization fails
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await signInWithProvider('google')
 *   // User will be redirected to Google login
 * } catch (error) {
 *   console.error('OAuth login failed:', error)
 * }
 * ```
 */
export async function signInWithProvider(provider: Provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) throw error
  return data
}