/**
 * Portfolio types for dashboard charts and KPI displays
 */

import type { Tables } from '@/models/database';

/** Portfolio snapshot row from database (generated type) */
export type PortfolioSnapshot = Tables<'portfolio_snapshots'>;

/** Time range options for portfolio chart */
export type PortfolioTimeRange = '1W' | '1M' | '3M' | '1Y' | 'ALL';

/** Chart data point for Recharts */
export interface PortfolioChartDataPoint {
  date: string;
  total: number;
  cards: number;
  sealed: number;
}

/** Calculated portfolio stats for KPI display */
export interface PortfolioStats {
  /** Net worth = total_card_value + total_product_value */
  netWorth: number;
  /** Total card value */
  cardValue: number;
  /** Number of cards */
  cardCount: number;
  /** Total sealed product value */
  sealedValue: number;
  /** Number of sealed products */
  sealedCount: number;
  /** % change in net worth over selected period (null if insufficient data) */
  netWorthChange: number | null;
  /** % change in card value over selected period (null if insufficient data) */
  cardValueChange: number | null;
  /** % change in sealed value over selected period (null if insufficient data) */
  sealedValueChange: number | null;
}

/** Series visibility state for chart */
export interface SeriesVisibility {
  total: boolean;
  cards: boolean;
  sealed: boolean;
}

/**
 * Live portfolio data calculated in real-time from collection_cards + pokemon_card_prices.
 * Used for KPIs and "today" data point on chart (before nightly snapshot runs).
 */
export interface LivePortfolioData {
  /** Total value of all cards in collection */
  total_card_value: number;
  /** Total number of cards (accounting for quantity) */
  card_count: number;
  /** Total value of sealed products (future feature) */
  total_product_value: number;
  /** Total number of sealed products (future feature) */
  product_count: number;
  /** Today's date as YYYY-MM-DD */
  recorded_at: string;
}
