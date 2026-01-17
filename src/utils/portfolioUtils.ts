/**
 * Utility functions for portfolio chart and KPI calculations.
 * All functions are pure JS - no database queries, runs on client side.
 */

import type {
  PortfolioSnapshot,
  PortfolioTimeRange,
  PortfolioChartDataPoint,
  PortfolioStats,
} from '@/types/portfolio';

// =============================================================================
// Time Range Helpers
// =============================================================================

/**
 * Converts time range to number of days.
 */
export function timeRangeToDays(range: PortfolioTimeRange): number {
  const daysMap: Record<PortfolioTimeRange, number> = {
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '1Y': 365,
    'ALL': 9999, // Effectively "all data"
  };
  return daysMap[range];
}

/**
 * Filters snapshots to only include those within the selected time range.
 * Returns snapshots sorted by date ascending (oldest first).
 */
export function filterSnapshotsByTimeRange(
  snapshots: PortfolioSnapshot[],
  range: PortfolioTimeRange
): PortfolioSnapshot[] {
  if (range === 'ALL' || snapshots.length === 0) {
    return [...snapshots].sort((a, b) =>
      a.recorded_at.localeCompare(b.recorded_at)
    );
  }

  const days = timeRangeToDays(range);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  return snapshots
    .filter((s) => s.recorded_at >= cutoffStr)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));
}

// =============================================================================
// Chart Data Transformation
// =============================================================================

/**
 * Transforms portfolio snapshots into chart-ready data points.
 */
export function transformToChartData(
  snapshots: PortfolioSnapshot[]
): PortfolioChartDataPoint[] {
  return snapshots.map((s) => ({
    date: s.recorded_at,
    total: Number(s.total_card_value) + Number(s.total_product_value),
    cards: Number(s.total_card_value),
    sealed: Number(s.total_product_value),
  }));
}

// =============================================================================
// Statistics Calculations
// =============================================================================

/**
 * Calculates percent change between first and last values in an array.
 * Returns null if insufficient data or division by zero.
 */
export function calculatePercentChange(values: number[]): number | null {
  if (values.length < 2) return null;

  const first = values[0];
  const last = values[values.length - 1];

  // Avoid division by zero
  if (first === 0) {
    // If starting from 0 and ending > 0, show as positive (but not infinite)
    if (last > 0) return 100;
    return null;
  }

  return ((last - first) / first) * 100;
}

/**
 * Calculates portfolio stats from filtered snapshots.
 * Uses the most recent snapshot for current values.
 * Calculates % change from first to last snapshot in the filtered set.
 */
export function calculatePortfolioStats(
  snapshots: PortfolioSnapshot[]
): PortfolioStats {
  // Default values when no data
  if (snapshots.length === 0) {
    return {
      netWorth: 0,
      cardValue: 0,
      cardCount: 0,
      sealedValue: 0,
      sealedCount: 0,
      netWorthChange: null,
      cardValueChange: null,
      sealedValueChange: null,
    };
  }

  // Get most recent snapshot for current values
  const latest = snapshots[snapshots.length - 1];
  const cardValue = Number(latest.total_card_value);
  const sealedValue = Number(latest.total_product_value);
  const netWorth = cardValue + sealedValue;

  // Calculate % changes
  const netWorthValues = snapshots.map(
    (s) => Number(s.total_card_value) + Number(s.total_product_value)
  );
  const cardValues = snapshots.map((s) => Number(s.total_card_value));
  const sealedValues = snapshots.map((s) => Number(s.total_product_value));

  return {
    netWorth,
    cardValue,
    cardCount: latest.card_count,
    sealedValue,
    sealedCount: latest.product_count,
    netWorthChange: calculatePercentChange(netWorthValues),
    cardValueChange: calculatePercentChange(cardValues),
    sealedValueChange: calculatePercentChange(sealedValues),
  };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

/**
 * Formats a number as currency (USD).
 * @param showCents - Whether to show cents (default: true for values < 1000)
 */
export function formatCurrency(
  value: number | null | undefined,
  showCents = true
): string {
  if (value === null || value === undefined) return '$0';

  // For values $1000+, optionally hide cents for cleaner display
  const shouldShowCents = showCents && value < 1000;

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: shouldShowCents ? 2 : 0,
    maximumFractionDigits: shouldShowCents ? 2 : 0,
  };

  return new Intl.NumberFormat('en-US', options).format(value);
}

/**
 * Formats a percent change with sign.
 */
export function formatPercentChange(change: number | null): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
} {
  if (change === null || change === undefined) {
    return {
      text: '—',
      isPositive: false,
      isNegative: false,
    };
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const sign = isPositive ? '+' : '';
  const text = `${sign}${change.toFixed(1)}%`;

  return { text, isPositive, isNegative };
}

/**
 * Formats a date string for chart X-axis labels.
 * Adapts format based on the time range for optimal readability.
 */
export function formatChartDate(
  dateStr: string,
  range: PortfolioTimeRange
): string {
  const date = new Date(dateStr);

  switch (range) {
    case '1W':
    case '1M':
      // Short range: "Dec 15" format
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    case '3M':
      // Medium range: "Dec 15" format
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    case '1Y':
      // Year range: Just month "Jan", "Feb"
      return date.toLocaleDateString('en-US', { month: 'short' });
    case 'ALL':
      // All time: "Dec '24" format
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
  }
}

/**
 * Formats a date for tooltip display (full format).
 */
export function formatTooltipDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculates evenly-spaced tick values for X-axis (max 4-5 ticks).
 */
export function calculateXAxisTicks(data: PortfolioChartDataPoint[]): string[] {
  if (data.length === 0) return [];
  if (data.length <= 5) return data.map((d) => d.date);

  // Show 4 ticks: start, 1/3, 2/3, end
  const indices = [
    0,
    Math.floor(data.length / 3),
    Math.floor((data.length * 2) / 3),
    data.length - 1,
  ];

  return indices.map((i) => data[i].date);
}
