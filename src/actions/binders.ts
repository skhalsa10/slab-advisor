'use server'

import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'
import type { Binder } from '@/types/database'

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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[createBinder] Unexpected error:', message)
    return { data: null, error: message }
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[renameBinder] Unexpected error:', message)
    return { data: null, error: message }
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
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[deleteBinder] Unexpected error:', message)
    return { success: false, error: message }
  }
}
