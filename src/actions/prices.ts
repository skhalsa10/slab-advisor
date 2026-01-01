'use server';

/**
 * Server actions for fetching price data.
 * All database queries happen server-side per security requirements.
 */

import { getServerSupabaseClient } from '@/lib/supabase-server';
import {
  type PokemonCardPrices,
  type PokemonCardPricesRow,
  castToPokemonCardPrices,
} from '@/types/prices';

/**
 * Fetches price data for a specific card.
 *
 * @param cardId - The pokemon_card_id to fetch prices for
 * @returns Object with data (PokemonCardPrices or null) and error message if any
 *
 * @example
 * ```tsx
 * const { data, error } = await getCardPrices('sv10-190');
 * if (error) console.error(error);
 * if (data) console.log(data.current_market_price);
 * ```
 */
export async function getCardPrices(cardId: string): Promise<{
  data: PokemonCardPrices | null;
  error: string | null;
}> {
  try {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from('pokemon_card_prices')
      .select('*')
      .eq('pokemon_card_id', cardId)
      .single();

    // PGRST116 = no rows found - not an error, just no price data
    if (error && error.code !== 'PGRST116') {
      console.error('[getCardPrices] Database error:', error.message);
      return { data: null, error: error.message };
    }

    // If no data found, return null without error
    if (!data) {
      return { data: null, error: null };
    }

    // Cast the raw database row to our typed interface
    const typedData = castToPokemonCardPrices(data as PokemonCardPricesRow);
    return { data: typedData, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[getCardPrices] Unexpected error:', message);
    return { data: null, error: message };
  }
}
