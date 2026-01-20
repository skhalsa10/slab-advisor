/**
 * Server-side Portfolio module for Slab Advisor
 *
 * This module provides secure server-side data fetching for portfolio snapshot data.
 * All database queries are performed server-side with proper authentication checks.
 *
 * IMPORTANT: This file runs ONLY on the server. Never import in client components.
 *
 * @module portfolio-server
 */

import { getAuthenticatedSupabaseClient } from './supabase-server';
import type { PortfolioSnapshot, LivePortfolioData } from '@/types/portfolio';

/**
 * Gets all portfolio snapshots for the authenticated user.
 *
 * Fetches up to 365 days of portfolio history for the current user.
 * Results are sorted by date ascending (oldest first) for charting.
 *
 * @returns Promise containing user's portfolio snapshots sorted by date ascending
 *
 * @throws {Error} When user is not authenticated or query fails
 *
 * @example
 * ```typescript
 * export default async function DashboardPage() {
 *   const snapshots = await getPortfolioSnapshots()
 *   return <DashboardClient snapshots={snapshots} />
 * }
 * ```
 */
export async function getPortfolioSnapshots(): Promise<PortfolioSnapshot[]> {
  try {
    // Create authenticated Supabase client that respects RLS policies
    const supabase = await getAuthenticatedSupabaseClient();

    // Validate user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Fetch portfolio snapshots (up to 365 days, sorted oldest first)
    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true })
      .limit(365);

    if (error) {
      console.error('Error fetching portfolio snapshots:', error);
      throw new Error('Failed to load portfolio data');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPortfolioSnapshots:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to load portfolio data');
  }
}

/**
 * Gets the most recent portfolio snapshot for the authenticated user.
 *
 * Useful for getting current values without loading full history.
 *
 * @returns Promise containing the latest snapshot or null if none exists
 *
 * @throws {Error} When user is not authenticated or query fails
 */
export async function getLatestPortfolioSnapshot(): Promise<PortfolioSnapshot | null> {
  try {
    const supabase = await getAuthenticatedSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = no rows found, which is valid (user has no snapshots yet)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching latest portfolio snapshot:', error);
      throw new Error('Failed to load portfolio data');
    }

    return data;
  } catch (error) {
    console.error('Error in getLatestPortfolioSnapshot:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to load portfolio data');
  }
}

/**
 * Calculates live/real-time portfolio data from collection_cards, collection_products,
 * and their associated price tables.
 *
 * This mirrors the logic in the `snapshot_all_portfolios()` database function.
 * Used for KPIs (always current) and as "today" data point on chart.
 *
 * Card price priority:
 * 1. Exact variant/condition price from prices_raw
 * 2. current_market_price (reliable default)
 * 3. Market average from prices_raw
 * 4. Zero (fallback)
 *
 * Product price: Uses market_price from pokemon_product_latest_prices view.
 *
 * @returns Promise containing live portfolio data with today's date
 *
 * @throws {Error} When user is not authenticated or query fails
 */
export async function getLivePortfolioData(): Promise<LivePortfolioData> {
  try {
    const supabase = await getAuthenticatedSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    // Calculate live portfolio data from collection_cards + pokemon_card_prices
    return await calculateLivePortfolioManually(supabase, user.id);
  } catch (error) {
    console.error('Error in getLivePortfolioData:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to calculate portfolio data');
  }
}

/**
 * Fetches user's collection products with their latest prices and calculates totals.
 * Mirrors the product_totals CTE in snapshot_all_portfolios().
 */
async function fetchProductTotals(
  supabase: Awaited<ReturnType<typeof getAuthenticatedSupabaseClient>>,
  userId: string
): Promise<{ total_product_value: number; product_count: number }> {
  // Fetch collection products for the user
  const { data: products, error } = await supabase
    .from('collection_products')
    .select('quantity, pokemon_product_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching collection products:', error);
    return { total_product_value: 0, product_count: 0 };
  }

  if (!products || products.length === 0) {
    return { total_product_value: 0, product_count: 0 };
  }

  // Get unique product IDs to fetch prices
  const productIds = [...new Set(products.map((p) => p.pokemon_product_id))];

  // Fetch prices from the pokemon_product_latest_prices view
  const { data: prices, error: priceError } = await supabase
    .from('pokemon_product_latest_prices')
    .select('pokemon_product_id, market_price')
    .in('pokemon_product_id', productIds);

  if (priceError) {
    console.error('Error fetching product prices:', priceError);
    return { total_product_value: 0, product_count: 0 };
  }

  // Build price lookup map
  const priceMap = new Map<number, number>();
  if (prices) {
    for (const price of prices) {
      if (price.pokemon_product_id !== null && price.market_price !== null) {
        priceMap.set(price.pokemon_product_id, Number(price.market_price));
      }
    }
  }

  // Calculate totals
  let totalProductValue = 0;
  let productCount = 0;

  for (const product of products) {
    const quantity = product.quantity ?? 1;
    productCount += quantity;

    const price = priceMap.get(product.pokemon_product_id) ?? 0;
    totalProductValue += quantity * price;
  }

  return {
    total_product_value: totalProductValue,
    product_count: productCount,
  };
}

/**
 * Manual calculation fallback if the RPC function doesn't exist.
 * Fetches collection cards with prices and calculates totals in JS.
 */
async function calculateLivePortfolioManually(
  supabase: Awaited<ReturnType<typeof getAuthenticatedSupabaseClient>>,
  userId: string
): Promise<LivePortfolioData> {
  // Use local date for the user - this ensures the live data point matches
  // what the user expects as "today" in their timezone
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Fetch cards and products in parallel for better performance
  const [cardsResult, productTotals] = await Promise.all([
    supabase
      .from('collection_cards')
      .select(
        `
        quantity,
        variant,
        condition,
        variant_pattern,
        pokemon_card_id,
        pokemon_cards!inner(
          pokemon_card_prices(
            current_market_price,
            current_market_price_condition,
            prices_raw,
            variant_pattern
          )
        )
      `
      )
      .eq('user_id', userId),
    fetchProductTotals(supabase, userId),
  ]);

  const { data: cards, error } = cardsResult;

  if (error) {
    console.error('Error fetching collection cards for calculation:', error);
    throw new Error('Failed to calculate portfolio data');
  }

  if (!cards || cards.length === 0) {
    return {
      total_card_value: 0,
      card_count: 0,
      total_product_value: productTotals.total_product_value,
      product_count: productTotals.product_count,
      recorded_at: today,
    };
  }

  let totalValue = 0;
  let cardCount = 0;

  // Variant mapping (matches snapshot_all_portfolios function)
  const variantMap: Record<string, string> = {
    holo: 'Holofoil',
    reverse_holo: 'Reverse Holofoil',
    first_edition: '1st Edition Holofoil',
    illustration_rare: 'Holofoil',
    alt_art: 'Holofoil',
    full_art: 'Holofoil',
    secret_rare: 'Holofoil',
    normal: 'Normal',
  };

  // Condition mapping (matches snapshot_all_portfolios function)
  const conditionMap: Record<string, string> = {
    mint: 'Near Mint',
    near_mint: 'Near Mint',
    lightly_played: 'Lightly Played',
    moderately_played: 'Moderately Played',
    heavily_played: 'Heavily Played',
    damaged: 'Damaged',
  };

  for (const card of cards) {
    const quantity = card.quantity ?? 1;
    cardCount += quantity;

    // Navigate through the nested structure: card -> pokemon_cards -> pokemon_card_prices
    // Note: pokemon_cards!inner returns a single object (not array) due to foreign key relationship
    const pokemonCard = card.pokemon_cards as unknown as {
      pokemon_card_prices: Array<{
        current_market_price: number | null;
        current_market_price_condition: string | null;
        prices_raw: unknown;
        variant_pattern: string | null;
      }>;
    } | null;

    if (!pokemonCard?.pokemon_card_prices) {
      continue; // No price data available
    }

    // Find matching price record (respecting variant_pattern)
    const priceRecords = Array.isArray(pokemonCard.pokemon_card_prices)
      ? pokemonCard.pokemon_card_prices
      : [pokemonCard.pokemon_card_prices];

    const priceRecord = priceRecords.find(
      (p) =>
        (card.variant_pattern === null && p.variant_pattern === null) ||
        card.variant_pattern === p.variant_pattern
    );

    if (!priceRecord) {
      continue; // No matching price record
    }

    // Calculate price using priority order
    let price = 0;

    // Priority 1: Extract exact variant/condition price from prices_raw
    const pricesRaw = priceRecord.prices_raw as Record<string, unknown> | null;
    if (pricesRaw?.variants) {
      const variantKey = variantMap[card.variant] ?? 'Normal';
      const conditionKey =
        conditionMap[card.condition ?? ''] ??
        (priceRecord.current_market_price_condition || 'Near Mint');

      const variants = pricesRaw.variants as Record<string, Record<string, { price?: number }>>;
      const variantPrices = variants?.[variantKey];
      const conditionPrice = variantPrices?.[conditionKey]?.price;

      if (conditionPrice !== undefined && conditionPrice !== null) {
        price = conditionPrice;
      }
    }

    // Priority 2: current_market_price
    if (price === 0 && priceRecord.current_market_price) {
      price = priceRecord.current_market_price;
    }

    // Priority 3: Market average from prices_raw
    if (price === 0 && pricesRaw?.market) {
      price = Number(pricesRaw.market) || 0;
    }

    totalValue += quantity * price;
  }

  return {
    total_card_value: totalValue,
    card_count: cardCount,
    total_product_value: productTotals.total_product_value,
    product_count: productTotals.product_count,
    recorded_at: today,
  };
}
