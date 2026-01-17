'use client';

import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type {
  PortfolioSnapshot,
  PortfolioTimeRange,
  PortfolioChartDataPoint,
  SeriesVisibility,
  LivePortfolioData,
} from '@/types/portfolio';
import {
  filterSnapshotsByTimeRange,
  transformToChartData,
  calculatePortfolioStats,
  formatCurrency,
  formatChartDate,
  formatTooltipDate,
  calculateXAxisTicks,
} from '@/utils/portfolioUtils';

interface PortfolioChartProps {
  /** Historical snapshots from nightly cron job */
  snapshots: PortfolioSnapshot[];
  /** Live/real-time data calculated from collection_cards */
  liveData: LivePortfolioData;
  timeRange: PortfolioTimeRange;
  onTimeRangeChange: (range: PortfolioTimeRange) => void;
}

const TIME_RANGES: { value: PortfolioTimeRange; label: string }[] = [
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'ALL' },
];

// Check icon for active series toggles
function CheckIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// Custom tooltip matching PriceWidget dark style
function CustomTooltip({
  active,
  payload,
  visibility,
}: {
  active?: boolean;
  payload?: Array<{ payload: PortfolioChartDataPoint }>;
  visibility: SeriesVisibility;
}) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-gray-900 px-3 py-2 rounded-lg shadow-lg">
      <div className="text-gray-400 text-xs mb-1">
        {formatTooltipDate(data.date)}
      </div>
      {visibility.total && (
        <div className="text-white font-bold text-base">
          Total: {formatCurrency(data.total)}
        </div>
      )}
      {visibility.cards && (
        <div className="text-orange-400 text-sm">
          Cards: {formatCurrency(data.cards)}
        </div>
      )}
      {visibility.sealed && data.sealed > 0 && (
        <div className="text-blue-400 text-sm">
          Sealed: {formatCurrency(data.sealed)}
        </div>
      )}
    </div>
  );
}

export default function PortfolioChart({
  snapshots,
  liveData,
  timeRange,
  onTimeRangeChange,
}: PortfolioChartProps) {
  // Series visibility state - Total is on by default
  const [visibility, setVisibility] = useState<SeriesVisibility>({
    total: true,
    cards: false,
    sealed: false,
  });

  // Filter and transform data for chart, replacing/appending today with liveData
  const { chartData, stats, xAxisTicks } = useMemo(() => {
    const filtered = filterSnapshotsByTimeRange(snapshots, timeRange);
    const data = transformToChartData(filtered);

    // Create live data point for today
    const todayDate = liveData.recorded_at;
    const todayPoint: PortfolioChartDataPoint = {
      date: todayDate,
      total: liveData.total_card_value + liveData.total_product_value,
      cards: liveData.total_card_value,
      sealed: liveData.total_product_value,
    };

    // Find if today already exists in the data (from snapshot)
    const todayIndex = data.findIndex((d) => d.date === todayDate);

    if (todayIndex >= 0) {
      // Replace snapshot data with live data (live is always more current)
      data[todayIndex] = todayPoint;
    } else {
      // Append live data as today's point
      data.push(todayPoint);
    }

    const calculatedStats = calculatePortfolioStats(filtered);
    const ticks = calculateXAxisTicks(data);
    return { chartData: data, stats: calculatedStats, xAxisTicks: ticks };
  }, [snapshots, liveData, timeRange]);

  // Calculate Y-axis domain
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    const values: number[] = [];
    chartData.forEach((d) => {
      if (visibility.total) values.push(d.total);
      if (visibility.cards) values.push(d.cards);
      if (visibility.sealed) values.push(d.sealed);
    });

    if (values.length === 0) return [0, 100];

    const min = Math.min(...values);
    const max = Math.max(...values);

    // Add 10% padding
    return [Math.floor(min * 0.9), Math.ceil(max * 1.1)];
  }, [chartData, visibility]);

  // Determine if price went up, down, or stayed same (for gradient color)
  const priceChange = stats.netWorthChange;

  // Toggle a series
  const toggleSeries = (series: keyof SeriesVisibility) => {
    setVisibility((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  // Check if sealed has any data
  const hasSealedData = chartData.some((d) => d.sealed > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Header: Series toggles (left) and Time range pills (right) */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Series toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => toggleSeries('total')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                visibility.total
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {visibility.total && <CheckIcon />}
              Total
            </button>
            <button
              onClick={() => toggleSeries('cards')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                visibility.cards
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {visibility.cards && <CheckIcon />}
              Cards
            </button>
            {hasSealedData && (
              <button
                onClick={() => toggleSeries('sealed')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  visibility.sealed
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {visibility.sealed && <CheckIcon />}
                Sealed
              </button>
            )}
          </div>

          {/* Time range pills */}
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => onTimeRangeChange(range.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range.value
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart area */}
      <div className="h-48 sm:h-64 px-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Total gradient - green for up, red for down (Robinhood style) */}
                <linearGradient id="totalGradientUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="totalGradientDown"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient
                  id="totalGradientNeutral"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(value) => formatChartDate(value, timeRange)}
                tickMargin={8}
                ticks={xAxisTicks}
              />

              <YAxis
                domain={yDomain}
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(value) => formatCurrency(value, false)}
                width={50}
                tickCount={3}
              />

              <Tooltip
                content={<CustomTooltip visibility={visibility} />}
                cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
              />

              {/* Total series - Area chart with gradient */}
              {visibility.total && (
                <Area
                  type="natural"
                  dataKey="total"
                  stroke={
                    priceChange !== null && priceChange > 0
                      ? '#22c55e'
                      : priceChange !== null && priceChange < 0
                        ? '#ef4444'
                        : '#6366f1'
                  }
                  strokeWidth={2}
                  fill={
                    priceChange !== null && priceChange > 0
                      ? 'url(#totalGradientUp)'
                      : priceChange !== null && priceChange < 0
                        ? 'url(#totalGradientDown)'
                        : 'url(#totalGradientNeutral)'
                  }
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill:
                      priceChange !== null && priceChange > 0
                        ? '#22c55e'
                        : priceChange !== null && priceChange < 0
                          ? '#ef4444'
                          : '#6366f1',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              )}

              {/* Cards series - Orange line only */}
              {visibility.cards && (
                <Area
                  type="natural"
                  dataKey="cards"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="transparent"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#f97316',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              )}

              {/* Sealed series - Blue line only */}
              {visibility.sealed && (
                <Area
                  type="natural"
                  dataKey="sealed"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="transparent"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: '#3b82f6',
                    stroke: '#fff',
                    strokeWidth: 2,
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No portfolio data available for this period
          </div>
        )}
      </div>
    </div>
  );
}
