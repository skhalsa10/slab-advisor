'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'

/**
 * Bulk deletes collection cards for the authenticated user.
 * All database operations run server-side only.
 *
 * @param cardIds - Array of collection_card IDs to delete
 * @returns Object with success flag, deleted count, or error message
 */
export async function bulkDeleteCollectionCards(cardIds: string[]): Promise<{
  success: boolean
  deletedCount: number
  error: string | null
}> {
  try {
    if (!cardIds || cardIds.length === 0) {
      return { success: false, deletedCount: 0, error: 'At least one card must be selected' }
    }

    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, deletedCount: 0, error: 'Authentication required' }
    }

    // Delete cards owned by this user (RLS also enforces this)
    const { data: deleted, error: deleteError } = await supabase
      .from('collection_cards')
      .delete()
      .in('id', cardIds)
      .eq('user_id', user.id)
      .select('id')

    if (deleteError) {
      console.error('Error bulk deleting collection cards:', deleteError)
      return { success: false, deletedCount: 0, error: 'Failed to delete cards' }
    }

    return { success: true, deletedCount: deleted?.length ?? 0, error: null }
  } catch (err) {
    console.error('[bulkDeleteCollectionCards] Unexpected error:', err instanceof Error ? err.message : err)
    return { success: false, deletedCount: 0, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Bulk deletes collection products for the authenticated user.
 * All database operations run server-side only.
 *
 * @param productIds - Array of collection_product IDs to delete
 * @returns Object with success flag, deleted count, or error message
 */
export async function bulkDeleteCollectionProducts(productIds: string[]): Promise<{
  success: boolean
  deletedCount: number
  error: string | null
}> {
  try {
    if (!productIds || productIds.length === 0) {
      return { success: false, deletedCount: 0, error: 'At least one product must be selected' }
    }

    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, deletedCount: 0, error: 'Authentication required' }
    }

    // Delete products owned by this user (RLS also enforces this)
    const { data: deleted, error: deleteError } = await supabase
      .from('collection_products')
      .delete()
      .in('id', productIds)
      .eq('user_id', user.id)
      .select('id')

    if (deleteError) {
      console.error('Error bulk deleting collection products:', deleteError)
      return { success: false, deletedCount: 0, error: 'Failed to delete products' }
    }

    return { success: true, deletedCount: deleted?.length ?? 0, error: null }
  } catch (err) {
    console.error('[bulkDeleteCollectionProducts] Unexpected error:', err instanceof Error ? err.message : err)
    return { success: false, deletedCount: 0, error: 'An unexpected error occurred. Please try again.' }
  }
}
