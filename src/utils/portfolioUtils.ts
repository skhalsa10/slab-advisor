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
// Date Conversion Helpers
// =============================================================================

/**
 * Converts a UTC timestamp string to a local date string (YYYY-MM-DD).
 * Uses the browser's timezone for conversion.
 *
 * This is essential for displaying dates correctly to users - the database stores
 * timestamps in UTC, but users expect to see dates in their local timezone.
 *
 * @param utcTimestamp - ISO timestamp string from database (e.g., "2026-01-17 00:00:00.227452+00")
 * @returns Local date string in YYYY-MM-DD format
 */
export function utcToLocalDateString(utcTimestamp: string | null): string {
  if (!utcTimestamp) {
    // Fallback to today's local date
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const date = new Date(utcTimestamp);
  // Use 'sv-SE' locale which outputs YYYY-MM-DD format (ISO-like)
  return date.toLocaleDateString('sv-SE');
}

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
 * Uses created_at (timestamptz) for timezone-aware comparison.
 * Returns snapshots sorted by date ascending (oldest first).
 */
export function filterSnapshotsByTimeRange(
  snapshots: PortfolioSnapshot[],
  range: PortfolioTimeRange
): PortfolioSnapshot[] {
  if (range === 'ALL' || snapshots.length === 0) {
    return [...snapshots].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });
  }

  const days = timeRangeToDays(range);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  cutoffDate.setHours(0, 0, 0, 0); // Start of day in local time

  return snapshots
    .filter((s) => {
      if (!s.created_at) return false;
      const snapshotDate = new Date(s.created_at);
      return snapshotDate >= cutoffDate;
    })
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });
}

// =============================================================================
// Chart Data Transformation
// =============================================================================

/**
 * Transforms portfolio snapshots into chart-ready data points.
 * Uses created_at (timestamptz) converted to local date for accurate display.
 */
export function transformToChartData(
  snapshots: PortfolioSnapshot[]
): PortfolioChartDataPoint[] {
  return snapshots.map((s) => ({
    date: utcToLocalDateString(s.created_at), // Use created_at converted to local timezone
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
 * Parses a date string (YYYY-MM-DD) into a Date object in local timezone.
 * This prevents timezone shift issues when displaying UTC dates locally.
 */
function parseDateLocal(dateStr: string): Date {
  // Split the date string to avoid timezone interpretation
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Formats a date string for chart X-axis labels.
 * Adapts format based on the time range for optimal readability.
 */
export function formatChartDate(
  dateStr: string,
  range: PortfolioTimeRange
): string {
  const date = parseDateLocal(dateStr);

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
  const date = parseDateLocal(dateStr);
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
