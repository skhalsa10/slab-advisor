import { SupabaseClient } from '@supabase/supabase-js'

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
  } catch {
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
 * @returns Success boolean and error message if any
 */
export async function deductUserCredits(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: deductError } = await supabase.rpc('deduct_user_credit', {
      user_id: userId,
    })

    if (deductError) {
      return {
        success: false,
        error: 'Failed to deduct credits'
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Failed to deduct credits'
    }
  }
}