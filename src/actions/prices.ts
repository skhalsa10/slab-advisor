'use server';

/**
 * Server actions for fetching price data.
 * All database queries happen server-side per security requirements.
 */

import { getServerSupabaseClient } from '@/lib/supabase-server';
import {
  type PokemonCardPrices,
  type PokemonCardPricesRow,
  type CombinedCardPrices,
  type VariantOption,
  castToPokemonCardPrices,
} from '@/types/prices';

// Key used for base variant records (null pattern stored as '_base' in Record)
const BASE_PATTERN_KEY = '_base';

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

/**
 * Helper function to get user-friendly display name for variant patterns.
 */
function getPatternDisplayName(pattern: string): string {
  const names: Record<string, string> = {
    poke_ball: 'Poké Ball',
    master_ball: 'Master Ball',
  };
  return names[pattern] || pattern;
}

/**
 * Fetches ALL price records for a card and combines them into a unified structure.
 * Cards with pattern variants (Poké Ball, Master Ball) have separate price records,
 * each with their own historical data, PSA grades, and conditions.
 *
 * @param cardId - The pokemon_card_id to fetch prices for
 * @returns Object with combined data or null, and error message if any
 *
 * @example
 * ```tsx
 * const { data, error } = await getAllCardPrices('sv08.5-004');
 * if (data) {
 *   // data.allVariants includes: Normal, Holofoil, Reverse Holofoil, Holofoil (Poké Ball), Holofoil (Master Ball)
 *   // data.records['_base'] has base variant prices
 *   // data.records['poke_ball'] has Poké Ball variant prices
 * }
 * ```
 */
export async function getAllCardPrices(cardId: string): Promise<{
  data: CombinedCardPrices | null;
  error: string | null;
}> {
  try {
    const supabase = getServerSupabaseClient();

    // Fetch ALL price records for this card (may have multiple for pattern variants)
    const { data, error } = await supabase
      .from('pokemon_card_prices')
      .select('*')
      .eq('pokemon_card_id', cardId);

    if (error) {
      console.error('[getAllCardPrices] Database error:', error.message);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    // Build combined structure
    const records: Record<string, PokemonCardPrices> = {};
    const allVariants: VariantOption[] = [];
    let primaryRecord: PokemonCardPrices | null = null;
    let hasPatternVariants = false;

    for (const row of data) {
      const priceRecord = castToPokemonCardPrices(row as PokemonCardPricesRow);
      const pattern = (row as { variant_pattern: string | null }).variant_pattern;

      // Use '_base' key for null pattern (base product)
      const recordKey = pattern || BASE_PATTERN_KEY;
      records[recordKey] = priceRecord;

      // Track if we have pattern variants
      if (pattern) {
        hasPatternVariants = true;
      }

      // Set primary record (base variant preferred)
      if (!pattern) {
        primaryRecord = priceRecord;
      }

      // Add variants from this record to the combined list
      const variants = priceRecord.raw_history_variants_tracked || [];
      for (const v of variants) {
        // For pattern variants, append the pattern name to make it clear
        const displayName = pattern ? `${v} (${getPatternDisplayName(pattern)})` : v;

        allVariants.push({
          displayName,
          variantKey: v,
          sourcePattern: pattern,
        });
      }
    }

    // If no base record, use first available as primary
    if (!primaryRecord) {
      primaryRecord = Object.values(records)[0];
    }

    // Sort allVariants to put base variants first, then pattern variants
    // This ensures the default selected variant is from the base record
    allVariants.sort((a, b) => {
      // Base variants (sourcePattern is null) come first
      if (a.sourcePattern === null && b.sourcePattern !== null) return -1;
      if (a.sourcePattern !== null && b.sourcePattern === null) return 1;
      // Within same pattern, keep original order
      return 0;
    });

    return {
      data: {
        records,
        allVariants,
        primaryRecord,
        hasPatternVariants,
      },
      error: null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[getAllCardPrices] Unexpected error:', message);
    return { data: null, error: message };
  }
}
