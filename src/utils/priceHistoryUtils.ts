/**
 * Utility functions for transforming and processing price history data.
 * Used by the PriceWidget to prepare data for charts.
 */

import type {
  ChartDataPoint,
  EbayPriceHistory,
  HistoryEntry,
  PokemonCardPrices,
  PsaGradeKey,
  PsaHistoryEntry,
  TimeRange,
  VariantConditionHistory,
} from '@/types/prices';

// =============================================================================
// Time Range Helpers
// =============================================================================

/**
 * Safely parses a value that might be a JSON string or already parsed object.
 * This handles cases where JSONB data is stored as a string in the database.
 */
function safeParseJson<T>(value: T | string | null): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

/**
 * Gets the raw history for a specific time range from price data.
 *
 * @param priceData - The full price data object
 * @param timeRange - The time range to get history for
 * @returns The variant/condition history for that time range, or null
 */
export function getRawHistoryForTimeRange(
  priceData: PokemonCardPrices,
  timeRange: TimeRange
): VariantConditionHistory | null {
  const historyMap: Record<TimeRange, VariantConditionHistory | null> = {
    '7d': safeParseJson(priceData.raw_history_7d),
    '30d': safeParseJson(priceData.raw_history_30d),
    '90d': safeParseJson(priceData.raw_history_90d),
    '365d': safeParseJson(priceData.raw_history_365d),
  };
  return historyMap[timeRange];
}

/**
 * Gets the percent change for a specific time range.
 *
 * @param priceData - The full price data object
 * @param timeRange - The time range to get change for
 * @returns The percent change, or null if not available
 */
export function getChangeForTimeRange(
  priceData: PokemonCardPrices,
  timeRange: TimeRange
): number | null {
  const changeMap: Record<TimeRange, number | null> = {
    '7d': priceData.change_7d_percent,
    '30d': priceData.change_30d_percent,
    '90d': priceData.change_90d_percent,
    '365d': priceData.change_365d_percent,
  };
  return changeMap[timeRange];
}

// =============================================================================
// Chart Data Transformation
// =============================================================================

/**
 * Transforms raw price history into chart-ready data points.
 *
 * @param history - The variant/condition history object
 * @param variant - Which variant to use (e.g., "Normal")
 * @param condition - Which condition to use (e.g., "Near Mint")
 * @returns Array of chart data points with date and value
 */
export function transformRawHistoryToChartData(
  history: VariantConditionHistory | null,
  variant: string,
  condition: string
): ChartDataPoint[] {
  if (!history) return [];

  const conditionHistory = history[variant]?.[condition];
  if (!conditionHistory || conditionHistory.length === 0) return [];

  return conditionHistory.map((entry: HistoryEntry) => ({
    date: entry.date,
    value: entry.market,
    label: formatCurrency(entry.market),
    volume: entry.volume ?? null,
  }));
}

/**
 * Slices PSA history to a specific time range and formats for chart.
 *
 * @param ebayHistory - The full ebay price history
 * @param grade - Which PSA grade to use ('psa10', 'psa9', 'psa8')
 * @param days - Number of days to include
 * @returns Array of chart data points
 */
export function getPsaHistoryForPeriod(
  ebayHistory: EbayPriceHistory | null,
  grade: PsaGradeKey,
  days: number
): ChartDataPoint[] {
  if (!ebayHistory) return [];

  const gradeHistory = ebayHistory[grade];
  if (!gradeHistory) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const entries = Object.entries(gradeHistory)
    .filter(([date]) => new Date(date) >= cutoff)
    .map(([date, data]: [string, PsaHistoryEntry]) => ({
      date,
      value: data.sevenDayAverage ?? data.average,
      label: formatCurrency(data.sevenDayAverage ?? data.average),
      volume: data.count ?? null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return entries;
}

/**
 * Converts time range to days number.
 *
 * @param timeRange - The time range string
 * @returns Number of days
 */
export function timeRangeToDays(timeRange: TimeRange): number {
  const daysMap: Record<TimeRange, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '365d': 365,
  };
  return daysMap[timeRange];
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Formats a number as currency (USD).
 *
 * @param value - The numeric value
 * @param showCents - Whether to show cents for small values
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  showCents = true
): string {
  if (value === null || value === undefined) return '—';

  // For values under $1, always show cents
  // For values $1000+, optionally hide cents for cleaner display
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: showCents || value < 1 ? 2 : 0,
    maximumFractionDigits: showCents || value < 1 ? 2 : 0,
  };

  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Formats a percent change with sign and color class.
 *
 * @param change - The percent change value
 * @returns Object with formatted text and color class
 */
export function formatPriceChange(change: number | null): {
  text: string;
  colorClass: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  if (change === null || change === undefined) {
    return {
      text: '—',
      colorClass: 'text-gray-400',
      isPositive: false,
      isNegative: false,
    };
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const sign = isPositive ? '+' : '';
  const text = `${sign}${change.toFixed(1)}%`;

  let colorClass = 'text-gray-500';
  if (isPositive) colorClass = 'text-green-600';
  if (isNegative) colorClass = 'text-red-600';

  return { text, colorClass, isPositive, isNegative };
}

/**
 * Formats a date string for chart axis labels.
 *
 * @param dateStr - ISO date string
 * @param timeRange - Current time range (affects format)
 * @returns Formatted date string
 */
export function formatChartDate(dateStr: string, timeRange: TimeRange): string {
  const date = new Date(dateStr);

  // For year range, show just month name (e.g., "Jan", "Feb")
  if (timeRange === '365d') {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  // For shorter ranges, show "Dec 15" format
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Formats a date for tooltip display.
 *
 * @param dateStr - ISO date string
 * @returns Formatted date string (e.g., "December 15, 2024")
 */
export function formatTooltipDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// =============================================================================
// Data Validation Helpers
// =============================================================================

/**
 * Checks if there's any raw price history available.
 *
 * @param priceData - The full price data object
 * @returns True if any history exists
 */
export function hasRawHistory(priceData: PokemonCardPrices): boolean {
  return !!(
    priceData.raw_history_7d ||
    priceData.raw_history_30d ||
    priceData.raw_history_90d ||
    priceData.raw_history_365d
  );
}

/**
 * Checks if there's any graded (PSA) data available.
 *
 * @param priceData - The full price data object
 * @returns True if any PSA data exists
 */
export function hasGradedData(priceData: PokemonCardPrices): boolean {
  return !!(priceData.psa10 || priceData.psa9 || priceData.psa8);
}

/**
 * Checks if there's any eBay price history for graded cards.
 *
 * @param priceData - The full price data object
 * @returns True if any eBay history exists
 */
export function hasGradedHistory(priceData: PokemonCardPrices): boolean {
  const history = priceData.ebay_price_history;
  if (!history) return false;

  return !!(
    (history.psa10 && Object.keys(history.psa10).length > 0) ||
    (history.psa9 && Object.keys(history.psa9).length > 0) ||
    (history.psa8 && Object.keys(history.psa8).length > 0)
  );
}

/**
 * Gets the first available variant from the history.
 *
 * @param priceData - The full price data object
 * @returns The first variant name, or "Normal" as default
 */
export function getDefaultVariant(priceData: PokemonCardPrices): string {
  const variants = priceData.raw_history_variants_tracked;
  if (!variants || variants.length === 0) return 'Normal';

  // Prefer "Normal" if available
  if (variants.includes('Normal')) return 'Normal';

  return variants[0];
}

/**
 * Gets the list of conditions available for a specific variant by inspecting
 * the raw_history_365d data (which is a superset of all shorter ranges).
 *
 * Falls back to raw_history_conditions_tracked if variant not found or history is null.
 *
 * @param priceData - The price data record
 * @param variantKey - The variant key to look up (e.g., "Normal", "Reverse Holofoil")
 * @returns Array of condition strings available for that variant
 */
export function getConditionsForVariant(
  priceData: PokemonCardPrices,
  variantKey: string
): string[] {
  const history = safeParseJson<VariantConditionHistory>(priceData.raw_history_365d);
  if (history && history[variantKey]) {
    const conditions = Object.keys(history[variantKey]);
    if (conditions.length > 0) {
      return conditions;
    }
  }

  // Fallback: use the flat conditions_tracked array
  return priceData.raw_history_conditions_tracked || [];
}

/**
 * Gets the first available condition from the history.
 * If variantKey is provided, scopes conditions to that variant.
 *
 * @param priceData - The full price data object
 * @param variantKey - Optional variant to scope conditions to
 * @returns The first condition name, or "Near Mint" as default
 */
export function getDefaultCondition(
  priceData: PokemonCardPrices,
  variantKey?: string
): string {
  const conditions = variantKey
    ? getConditionsForVariant(priceData, variantKey)
    : priceData.raw_history_conditions_tracked;
  if (!conditions || conditions.length === 0) return 'Near Mint';

  // Prefer "Near Mint" if available
  if (conditions.includes('Near Mint')) return 'Near Mint';

  return conditions[0];
}

/**
 * Gets the first available PSA grade with data.
 *
 * @param priceData - The full price data object
 * @returns The first grade key with data, or 'psa10' as default
 */
export function getDefaultGrade(priceData: PokemonCardPrices): PsaGradeKey {
  if (priceData.psa10) return 'psa10';
  if (priceData.psa9) return 'psa9';
  if (priceData.psa8) return 'psa8';
  return 'psa10';
}

/**
 * Converts PSA grade key to display label.
 *
 * @param gradeKey - The grade key ('psa10', 'psa9', 'psa8')
 * @returns Display label (e.g., 'PSA 10')
 */
export function gradeKeyToLabel(gradeKey: PsaGradeKey): string {
  const labels: Record<PsaGradeKey, string> = {
    psa10: 'PSA 10',
    psa9: 'PSA 9',
    psa8: 'PSA 8',
  };
  return labels[gradeKey];
}
