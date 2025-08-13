/**
 * Pokemon Database Server module for Slab Advisor
 * 
 * This module provides SERVER-ONLY database operations for Pokemon TCG data.
 * It uses service role client for secure server-side access.
 * 
 * IMPORTANT: This file should ONLY be imported in Server Components or API routes.
 * Importing this in Client Components will cause build errors.
 * 
 * @module pokemon-db-server
 */

import { getServerSupabaseClient } from './supabase-server'
import type { PokemonSetWithSeries } from '@/models/pokemon'

/**
 * Fetch all sets with their series information (server-side)
 * 
 * Server-side version of getAllSetsWithSeries for use in Server Components.
 * Uses service role client for secure, server-only database access.
 * Perfect for SSR and pre-loading data with better security.
 * 
 * @returns Promise containing array of sets with series info
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent() {
 *   const sets = await getAllSetsWithSeriesServer()
 *   return <ClientComponent initialSets={sets} />
 * }
 * ```
 */
export async function getAllSetsWithSeriesServer(): Promise<PokemonSetWithSeries[]> {
  try {
    const supabase = getServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('pokemon_sets')
      .select(`
        *,
        series:pokemon_series(
          id,
          name
        )
      `)
      .order('release_date', { ascending: false })
    
    if (error) {
      console.error('Error fetching sets with series (server):', error)
      throw new Error('Failed to fetch Pokemon sets')
    }
    
    return (data || []) as PokemonSetWithSeries[]
  } catch (error) {
    console.error('Error in getAllSetsWithSeriesServer:', error)
    throw new Error('Failed to fetch Pokemon sets')
  }
}