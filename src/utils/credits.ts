import { SupabaseClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'

interface CreditCheckResult {
  hasCredits: boolean
  creditsRemaining: number
  error?: string
}

/**
 * Check if a user has sufficient credits for an operation
 * @param supabase - The Supabase client
 * @param userId - The user's ID
 * @param requiredCredits - Number of credits required (default: 1)
 * @returns Object with hasCredits boolean and credit details
 */
export async function checkUserCredits(
  supabase: SupabaseClient,
  userId: string,
  requiredCredits: number = 1
): Promise<CreditCheckResult> {
  try {
    const { data: creditData, error: creditError } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single()

    if (creditError) {
      console.error('Credit check error:', creditError)
      return {
        hasCredits: false,
        creditsRemaining: 0,
        error: 'Failed to check credits'
      }
    }

    if (!creditData) {
      return {
        hasCredits: false,
        creditsRemaining: 0,
        error: 'No credit data found'
      }
    }

    const hasCredits = creditData.credits_remaining >= requiredCredits
    
    return {
      hasCredits,
      creditsRemaining: creditData.credits_remaining,
      error: hasCredits ? undefined : 'Insufficient credits'
    }
  } catch (error) {
    console.error('Unexpected error checking credits:', error)
    return {
      hasCredits: false,
      creditsRemaining: 0,
      error: 'Failed to check credits'
    }
  }
}

/**
 * Deduct credits from a user's account
 * @param supabase - The Supabase client
 * @param userId - The user's ID
 * @param creditsToDeduct - Number of credits to deduct (default: 1)
 * @returns Success boolean and error message if any
 */
export async function deductUserCredits(
  supabase: SupabaseClient,
  userId: string,
  creditsToDeduct: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deductError } = await supabase.rpc('deduct_user_credit', {
      user_id: userId,
    })

    if (deductError) {
      console.error('Credit deduction error:', deductError)
      return {
        success: false,
        error: 'Failed to deduct credits'
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Unexpected error deducting credits:', error)
    return {
      success: false,
      error: 'Failed to deduct credits'
    }
  }
}