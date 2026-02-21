'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'
import type { Binder, BinderCard } from '@/types/database'

/**
 * Creates a new custom binder for the authenticated user.
 * All database operations run server-side only.
 *
 * @param name - The binder name (required, non-empty)
 * @returns Object with created binder data or error message
 */
export async function createBinder(name: string): Promise<{
  data: Binder | null
  error: string | null
}> {
  try {
    if (!name || !name.trim()) {
      return { data: null, error: 'Binder name is required' }
    }

    const trimmedName = name.trim()

    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Generate slug server-side using the database function
    const { data: slug, error: slugError } = await supabase
      .rpc('generate_binder_slug', { p_name: trimmedName })

    if (slugError || !slug) {
      console.error('Error generating binder slug:', slugError)
      return { data: null, error: 'Failed to generate binder slug' }
    }

    // Get next sort_order (after all existing binders)
    const { data: existingBinders } = await supabase
      .from('binders')
      .select('sort_order')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = (existingBinders?.[0]?.sort_order ?? 0) + 1

    // Insert the new binder
    const { data: binder, error: insertError } = await supabase
      .from('binders')
      .insert({
        user_id: user.id,
        name: trimmedName,
        slug,
        is_default: false,
        sort_order: nextSortOrder
      })
      .select()
      .single()

    if (insertError) {
      // Handle unique constraint violation (duplicate slug)
      if (insertError.code === '23505') {
        return { data: null, error: 'A binder with a similar name already exists' }
      }
      console.error('Error creating binder:', insertError)
      return { data: null, error: 'Failed to create binder' }
    }

    return { data: binder, error: null }
  } catch (err) {
    console.error('[createBinder] Unexpected error:', err instanceof Error ? err.message : err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Renames a custom binder for the authenticated user.
 * Cannot rename the default "All Cards" binder (enforced by DB trigger).
 *
 * @param binderId - The binder ID to rename
 * @param name - The new binder name (required, non-empty)
 * @returns Object with updated binder data or error message
 */
export async function renameBinder(binderId: string, name: string): Promise<{
  data: Binder | null
  error: string | null
}> {
  try {
    if (!name || !name.trim()) {
      return { data: null, error: 'Binder name is required' }
    }

    const trimmedName = name.trim()

    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Generate new slug
    const { data: slug, error: slugError } = await supabase
      .rpc('generate_binder_slug', { p_name: trimmedName })

    if (slugError || !slug) {
      console.error('Error generating binder slug:', slugError)
      return { data: null, error: 'Failed to generate binder slug' }
    }

    const { data: binder, error: updateError } = await supabase
      .from('binders')
      .update({ name: trimmedName, slug })
      .eq('id', binderId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      if (updateError.code === '23505') {
        return { data: null, error: 'A binder with a similar name already exists' }
      }
      console.error('Error renaming binder:', updateError)
      return { data: null, error: 'Failed to rename binder' }
    }

    return { data: binder, error: null }
  } catch (err) {
    console.error('[renameBinder] Unexpected error:', err instanceof Error ? err.message : err)
    return { data: null, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Deletes a custom binder for the authenticated user.
 * Cannot delete the default "All Cards" binder (enforced by RLS policy).
 * Cascade deletes associated binder_cards entries.
 *
 * @param binderId - The binder ID to delete
 * @returns Object with success flag or error message
 */
export async function deleteBinder(binderId: string): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    const { error: deleteError } = await supabase
      .from('binders')
      .delete()
      .eq('id', binderId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting binder:', deleteError)
      return { success: false, error: 'Failed to delete binder' }
    }

    return { success: true, error: null }
  } catch (err) {
    console.error('[deleteBinder] Unexpected error:', err instanceof Error ? err.message : err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Adds multiple collection cards to a custom binder.
 * Uses upsert with ignoreDuplicates to gracefully handle cards already in the binder.
 * All database operations run server-side only.
 *
 * @param binderId - The target binder ID (must not be the default binder)
 * @param cardIds - Array of collection_card IDs to add
 * @returns Object with created binder_card entries or error message
 */
export async function addCardsToBinder(binderId: string, cardIds: string[]): Promise<{
  data: BinderCard[]
  error: string | null
}> {
  try {
    if (!binderId) {
      return { data: [], error: 'Binder ID is required' }
    }
    if (!cardIds || cardIds.length === 0) {
      return { data: [], error: 'At least one card must be selected' }
    }

    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: [], error: 'Authentication required' }
    }

    // Verify the binder belongs to this user and is not the default binder
    const { data: binder, error: binderError } = await supabase
      .from('binders')
      .select('id, is_default')
      .eq('id', binderId)
      .eq('user_id', user.id)
      .single()

    if (binderError || !binder) {
      return { data: [], error: 'Binder not found' }
    }

    if (binder.is_default) {
      return { data: [], error: 'Cannot add cards to the default binder' }
    }

    // Build the rows to upsert
    const rows = cardIds.map((cardId) => ({
      binder_id: binderId,
      collection_card_id: cardId
    }))

    // Upsert with ignoreDuplicates to handle cards already in the binder
    const { data: binderCards, error: upsertError } = await supabase
      .from('binder_cards')
      .upsert(rows, {
        onConflict: 'binder_id,collection_card_id',
        ignoreDuplicates: true
      })
      .select()

    if (upsertError) {
      console.error('Error adding cards to binder:', upsertError)
      return { data: [], error: 'Failed to add cards to binder' }
    }

    return { data: binderCards ?? [], error: null }
  } catch (err) {
    console.error('[addCardsToBinder] Unexpected error:', err instanceof Error ? err.message : err)
    return { data: [], error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Removes multiple collection cards from a custom binder.
 * Cards remain in the user's collection — only the binder association is removed.
 * All database operations run server-side only.
 *
 * @param binderId - The binder ID to remove cards from (must not be the default binder)
 * @param cardIds - Array of collection_card IDs to remove
 * @returns Object with success flag, count of removed entries, or error message
 */
export async function removeCardsFromBinder(binderId: string, cardIds: string[]): Promise<{
  success: boolean
  removedCount: number
  error: string | null
}> {
  try {
    if (!binderId) {
      return { success: false, removedCount: 0, error: 'Binder ID is required' }
    }
    if (!cardIds || cardIds.length === 0) {
      return { success: false, removedCount: 0, error: 'At least one card must be selected' }
    }

    const supabase = await getAuthenticatedSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, removedCount: 0, error: 'Authentication required' }
    }

    // Verify the binder belongs to this user and is not the default binder
    const { data: binder, error: binderError } = await supabase
      .from('binders')
      .select('id, is_default')
      .eq('id', binderId)
      .eq('user_id', user.id)
      .single()

    if (binderError || !binder) {
      return { success: false, removedCount: 0, error: 'Binder not found' }
    }

    if (binder.is_default) {
      return { success: false, removedCount: 0, error: 'Cannot remove cards from the default binder' }
    }

    // Delete the binder_cards entries for the specified cards
    const { data: deleted, error: deleteError } = await supabase
      .from('binder_cards')
      .delete()
      .eq('binder_id', binderId)
      .in('collection_card_id', cardIds)
      .select('id')

    if (deleteError) {
      console.error('Error removing cards from binder:', deleteError)
      return { success: false, removedCount: 0, error: 'Failed to remove cards from binder' }
    }

    return { success: true, removedCount: deleted?.length ?? 0, error: null }
  } catch (err) {
    console.error('[removeCardsFromBinder] Unexpected error:', err instanceof Error ? err.message : err)
    return { success: false, removedCount: 0, error: 'An unexpected error occurred. Please try again.' }
  }
}
