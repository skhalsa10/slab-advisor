import { supabase } from './supabase'
import type { User, Provider } from '@supabase/supabase-js'

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

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

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

export async function deductCredit(userId: string) {
  const { error } = await supabase.rpc('deduct_user_credit', {
    user_id: userId
  })
  
  if (error) throw error
}

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