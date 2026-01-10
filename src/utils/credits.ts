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

interface DeductCreditResult {
  success: boolean
  error?: string
  free_credits?: number
  purchased_credits?: number
  total_credits?: number
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
): Promise<DeductCreditResult> {
  try {
    const { data, error: deductError } = await supabase.rpc('deduct_user_credit', {
      p_user_id: userId,
    })

    if (deductError) {
      console.error('Credit deduction RPC error:', deductError)
      return {
        success: false,
        error: 'Failed to deduct credits'
      }
    }

    // The function returns a JSONB object
    const result = data as {
      success: boolean
      error?: string
      error_code?: string
      free_credits?: number
      purchased_credits?: number
      total_credits?: number
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to deduct credits'
      }
    }

    return {
      success: true,
      free_credits: result.free_credits,
      purchased_credits: result.purchased_credits,
      total_credits: result.total_credits
    }
  } catch (err) {
    console.error('Credit deduction error:', err)
    return {
      success: false,
      error: 'Failed to deduct credits'
    }
  }
}

/**
 * Refund a credit to a user's account (used when grading fails)
 * @param supabase - The Supabase client
 * @param userId - The user's ID
 * @returns Success boolean and error message if any
 */
export async function refundUserCredit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try the RPC function first
    const { data, error } = await supabase.rpc('refund_user_credit', {
      p_user_id: userId,
    })

    if (error) {
      console.error('Credit refund RPC error:', error)
      return {
        success: false,
        error: 'Failed to refund credit'
      }
    }

    // Check if RPC returned a result object
    if (data && typeof data === 'object' && 'success' in data) {
      const result = data as { success: boolean; error?: string }
      return {
        success: result.success,
        error: result.error
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Credit refund error:', err)
    return {
      success: false,
      error: 'Failed to refund credit'
    }
  }
}