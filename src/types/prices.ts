/**
 * Price-related TypeScript types for the PriceWidget and related components.
 * These types provide specific typing for JSONB fields in pokemon_card_prices table.
 *
 * The base database Row type is in src/models/database.ts (auto-generated).
 * This file adds typed structures for JSONB fields and UI types.
 */

import type { Database } from '@/models/database';

// =============================================================================
// Database Row Type (from auto-generated types)
// =============================================================================

/** Base row type from Supabase - JSONB fields are typed as Json */
export type PokemonCardPricesRow =
  Database['public']['Tables']['pokemon_card_prices']['Row'];

// =============================================================================
// Raw Price History Types (for raw_history_* JSONB fields)
// =============================================================================

/** A single price history entry for raw/ungraded cards */
export interface HistoryEntry {
  date: string;
  market: number;
  low: number;
  mid: number;
  high: number;
  volume?: number;
}

/**
 * Nested structure for raw price history: Variant -> Condition -> History[]
 * Example: { "Normal": { "Near Mint": [...], "Lightly Played": [...] } }
 */
export interface VariantConditionHistory {
  [variant: string]: {
    [condition: string]: HistoryEntry[];
  };
}

// =============================================================================
// PSA/Graded Price Types (for psa10, psa9, psa8, ebay_price_history JSONB fields)
// =============================================================================

/** Smart market price data from eBay sales analysis */
export interface SmartMarketPrice {
  price: number;
  confidence: 'high' | 'medium' | 'low';
  marketVolatility: 'stable' | 'volatile' | 'unknown';
}

/** PSA grade data from ebay.salesByGrade (psa10, psa9, psa8 columns) */
export interface PsaGradeData {
  totalSales: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  smartMarketPrice?: SmartMarketPrice;
}

/** PSA history entry (sparse, date-keyed) from eBay sales */
export interface PsaHistoryEntry {
  average: number;
  count: number;
  totalValue: number;
  sevenDayAverage?: number;
  sevenDayVolumeAvg?: number;
  sevenDayValueAvg?: number;
  rollingWindow?: number;
}

/** Full eBay price history organized by PSA grade (ebay_price_history column) */
export interface EbayPriceHistory {
  psa10?: Record<string, PsaHistoryEntry>;
  psa9?: Record<string, PsaHistoryEntry>;
  psa8?: Record<string, PsaHistoryEntry>;
}

// =============================================================================
// Typed Price Data (extends DB row with properly typed JSONB fields)
// =============================================================================

/**
 * Typed version of PokemonCardPricesRow with JSONB fields properly typed.
 * Use this in components instead of the raw database Row type.
 */
export interface PokemonCardPrices {
  id: string;
  pokemon_card_id: string;
  tcgplayer_product_id: number | null;

  // Current raw prices
  current_market_price: number | null;
  current_market_price_condition: string | null;

  // Current graded prices (PSA) - typed JSONB
  psa10: PsaGradeData | null;
  psa9: PsaGradeData | null;
  psa8: PsaGradeData | null;

  // Pre-computed price changes (%)
  change_7d_percent: number | null;
  change_30d_percent: number | null;
  change_90d_percent: number | null;
  change_180d_percent: number | null;
  change_365d_percent: number | null;

  // Raw API responses
  prices_raw: unknown | null;
  ebay_price_history: EbayPriceHistory | null;

  // Pre-sliced raw history by time window - typed JSONB
  raw_history_7d: VariantConditionHistory | null;
  raw_history_30d: VariantConditionHistory | null;
  raw_history_90d: VariantConditionHistory | null;
  raw_history_180d: VariantConditionHistory | null;
  raw_history_365d: VariantConditionHistory | null;

  // Tracked variants and conditions
  raw_history_variants_tracked: string[] | null;
  raw_history_conditions_tracked: string[] | null;

  // Metadata
  last_updated: string | null;
  created_at: string | null;
}

/**
 * Cast a raw database row to the typed version.
 * This is safe because we control the JSON structure in our sync script.
 */
export function castToPokemonCardPrices(
  row: PokemonCardPricesRow
): PokemonCardPrices {
  return row as unknown as PokemonCardPrices;
}

// =============================================================================
// UI/Widget Types
// =============================================================================

/** Time range options for the chart */
export type TimeRange = '7d' | '30d' | '90d' | '365d';

/** View mode for the widget (Raw ungraded vs Graded PSA) */
export type ViewMode = 'Raw' | 'Graded';

/** PSA grade options */
export type PsaGrade = 'PSA 10' | 'PSA 9' | 'PSA 8';

/** PSA grade key for accessing data */
export type PsaGradeKey = 'psa10' | 'psa9' | 'psa8';

/** Chart data point for Recharts */
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  volume?: number | null;
}

// =============================================================================
// Component Props Types
// =============================================================================

/** Props for the main PriceWidget client component */
export interface PriceWidgetProps {
  priceData: PokemonCardPrices;
  className?: string;
}

/** Props for the PriceWidgetServer component */
export interface PriceWidgetServerProps {
  cardId: string;
  className?: string;
}

/** Props for the PriceWidgetEmpty component */
export interface PriceWidgetEmptyProps {
  message?: string;
  className?: string;
}

/** Props for the PriceWidgetSkeleton component */
export interface PriceWidgetSkeletonProps {
  className?: string;
}
