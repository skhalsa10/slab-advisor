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
import type { PokemonSetWithSeries, PokemonBrowseData } from '@/models/pokemon'


/**
 * Fetch Pokemon browse data with optimized series dropdown
 * 
 * Returns both sets and unique series data optimized for browse page.
 * Eliminates need for client-side series extraction and deduplication.
 * 
 * @returns Promise containing sets and series data for browse page
 * @throws Error if database query fails
 * 
 * @example
 * ```typescript
 * export default async function ServerComponent() {
 *   const { sets, series } = await getPokemonBrowseDataServer()
 *   return <ClientComponent initialSets={sets} seriesOptions={series} />
 * }
 * ```
 */
export async function getPokemonBrowseDataServer(): Promise<PokemonBrowseData> {
  try {
    const supabase = getServerSupabaseClient()
    
    // Fetch sets with series info
    const { data: sets, error: setsError } = await supabase
      .from('pokemon_sets')
      .select(`
        *,
        series:pokemon_series(
          id,
          name
        )
      `)
      .order('release_date', { ascending: false })
    
    if (setsError) {
      console.error('Error fetching sets with series (server):', setsError)
      throw new Error('Failed to fetch Pokemon sets')
    }
    
    // Fetch unique series for dropdown (more efficient than client-side deduplication)
    const { data: series, error: seriesError } = await supabase
      .from('pokemon_series')
      .select('id, name')
      .order('name')
    
    if (seriesError) {
      console.error('Error fetching series (server):', seriesError)
      throw new Error('Failed to fetch Pokemon series')
    }
    
    return {
      sets: (sets || []) as PokemonSetWithSeries[],
      series: series || []
    }
  } catch (error) {
    console.error('Error in getPokemonBrowseDataServer:', error)
    throw new Error('Failed to fetch Pokemon browse data')
  }
}