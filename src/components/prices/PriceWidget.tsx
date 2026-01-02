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
  PriceWidgetProps,
  TimeRange,
  ViewMode,
  PsaGradeKey,
  ChartDataPoint,
} from '@/types/prices';
import {
  formatCurrency,
  formatPriceChange,
  formatChartDate,
  formatTooltipDate,
  getRawHistoryForTimeRange,
  transformRawHistoryToChartData,
  getPsaHistoryForPeriod,
  timeRangeToDays,
  hasRawHistory,
  hasGradedData,
  getDefaultVariant,
  getDefaultCondition,
  getDefaultGrade,
  gradeKeyToLabel,
} from '@/utils/priceHistoryUtils';

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '1M' },
  { value: '90d', label: '3M' },
  { value: '365d', label: '1Y' },
];

const PSA_GRADES: { value: PsaGradeKey; label: string }[] = [
  { value: 'psa10', label: 'PSA 10' },
  { value: 'psa9', label: 'PSA 9' },
  { value: 'psa8', label: 'PSA 8' },
];

/**
 * Main PriceWidget client component with 3-zone layout.
 * Receives price data from server, handles all UI state internally.
 */
export function PriceWidget({ priceData, className = '' }: PriceWidgetProps) {
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('Raw');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [condition, setCondition] = useState(() => getDefaultCondition(priceData));
  const [variant, setVariant] = useState(() => getDefaultVariant(priceData));
  const [grade, setGrade] = useState<PsaGradeKey>(() => getDefaultGrade(priceData));

  // Derived data
  const hasRaw = hasRawHistory(priceData);
  const hasGraded = hasGradedData(priceData);

  // Get available options
  const availableVariants = priceData.raw_history_variants_tracked || [];
  const availableConditions = priceData.raw_history_conditions_tracked || [];
  const availableGrades = PSA_GRADES.filter(
    (g) => priceData[g.value] !== null
  );

  // Chart data based on current view mode
  const rawChartData: ChartDataPoint[] = useMemo(() => {
    if (viewMode === 'Raw') {
      const history = getRawHistoryForTimeRange(priceData, timeRange);
      return transformRawHistoryToChartData(history, variant, condition);
    } else {
      return getPsaHistoryForPeriod(
        priceData.ebay_price_history,
        grade,
        timeRangeToDays(timeRange)
      );
    }
  }, [viewMode, timeRange, variant, condition, grade, priceData]);

  // Handle single data point by creating a flat line
  // Recharts can't draw a line/area with only 1 point
  // For graded view, append today's smart market price so chart ends at displayed price
  const chartData: ChartDataPoint[] = useMemo(() => {
    let data = rawChartData;

    // For graded view, add today's data point with smart market price
    // This ensures the chart ends at the price shown in the header
    if (viewMode === 'Graded' && data.length > 0) {
      const gradeData = priceData[grade];
      const smartPrice = gradeData?.smartMarketPrice?.price ?? gradeData?.avgPrice;

      if (smartPrice !== null && smartPrice !== undefined) {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = data[data.length - 1].date;

        // Only add if today is different from the last data point
        if (today !== lastDate.split('T')[0]) {
          data = [
            ...data,
            { date: today, value: smartPrice, volume: null },
          ];
        }
      }
    }

    // Handle single data point - create flat line
    if (data.length === 1) {
      const point = data[0];
      const pointDate = new Date(point.date);
      const daysBack = timeRangeToDays(timeRange);
      const startDate = new Date(pointDate);
      startDate.setDate(startDate.getDate() - daysBack);

      return [
        { date: startDate.toISOString().split('T')[0], value: point.value },
        point,
      ];
    }

    return data;
  }, [rawChartData, timeRange, viewMode, grade, priceData]);

  // Current price display - get the most recent price from chart data
  const currentPrice = useMemo(() => {
    if (viewMode === 'Raw') {
      // Get the latest price from the chart data (most recent entry)
      // Only show price if we have data for the selected variant/condition
      if (chartData.length > 0) {
        return chartData[chartData.length - 1].value;
      }
      // No data for this variant/condition - return null
      return null;
    } else {
      const gradeData = priceData[grade];
      return gradeData?.smartMarketPrice?.price ?? gradeData?.avgPrice ?? null;
    }
  }, [viewMode, grade, priceData, chartData]);

  // Calculate price change from chart data (first vs last data point)
  // Works for both Raw and Graded views
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;

    // Avoid division by zero
    if (firstValue === 0) return null;

    const percentChange = ((lastValue - firstValue) / firstValue) * 100;
    return percentChange;
  }, [chartData]);

  const changeDisplay = formatPriceChange(priceChange);

  // Calculate evenly spaced tick values for X-axis (4-5 ticks max)
  const xAxisTicks = useMemo(() => {
    if (chartData.length === 0) return [];
    if (chartData.length <= 5) return chartData.map((d) => d.date);

    // Show 4 ticks: start, 1/3, 2/3, end
    const indices = [
      0,
      Math.floor(chartData.length / 3),
      Math.floor((chartData.length * 2) / 3),
      chartData.length - 1,
    ];

    return indices.map((i) => chartData[i].date);
  }, [chartData]);

  // PSA 10 potential (shown in footer when viewing Raw)
  const psa10Potential = priceData.psa10?.smartMarketPrice?.price ?? priceData.psa10?.avgPrice ?? null;

  // Calculate total volume (sales count) for the current period
  const totalVolume = useMemo(() => {
    return chartData.reduce((sum, point) => sum + (point.volume ?? 0), 0);
  }, [chartData]);

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* ================================================================= */}
      {/* ZONE 1: HEADER (Control Deck) */}
      {/* ================================================================= */}
      <div className="p-5 border-b border-gray-100">
        {/* Top row: Label + Dropdown + Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Market Value
            </span>

            {/* Condition/Grade Dropdown */}
            {viewMode === 'Raw' ? (
              availableConditions.length > 1 ? (
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {availableConditions.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-600">{condition}</span>
              )
            ) : (
              availableGrades.length > 1 ? (
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as PsaGradeKey)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  {availableGrades.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-600">
                  {gradeKeyToLabel(grade)}
                </span>
              )
            )}
          </div>

          {/* Mode Toggle (Raw/Graded) */}
          {hasRaw && hasGraded && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('Raw')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'Raw'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => setViewMode('Graded')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'Graded'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Graded
              </button>
            </div>
          )}
        </div>

        {/* Variant selector (if multiple variants) */}
        {viewMode === 'Raw' && availableVariants.length > 1 && (
          <div className="flex gap-2 mb-3">
            {availableVariants.map((v) => (
              <button
                key={v}
                onClick={() => setVariant(v)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  variant === v
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Hero row: Price + Trend Badge */}
        <div className="flex items-baseline gap-3">
          {currentPrice !== null ? (
            <span className="text-3xl font-bold text-gray-900">
              {formatCurrency(currentPrice)}
            </span>
          ) : (
            <span className="text-xl font-medium text-gray-400">
              No price available
            </span>
          )}
          {priceChange !== null && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${
                changeDisplay.isPositive
                  ? 'bg-green-100 text-green-700'
                  : changeDisplay.isNegative
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {changeDisplay.isPositive && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
              {changeDisplay.isNegative && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
              {changeDisplay.text}
            </span>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ZONE 2: STAGE (Visualization) */}
      {/* ================================================================= */}
      <div className="h-48 sm:h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
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
                domain={[
                  (dataMin: number) => Math.floor(dataMin * 0.9),
                  (dataMax: number) => Math.ceil(dataMax * 1.1),
                ]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(value) => formatCurrency(value, false)}
                width={60}
                tickMargin={4}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as ChartDataPoint;
                  return (
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                      <div className="font-medium">{formatCurrency(data.value)}</div>
                      <div className="text-gray-400 text-xs">
                        {formatTooltipDate(data.date)}
                      </div>
                    </div>
                  );
                }}
              />
              <Area
                type="natural"
                dataKey="value"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: '#f97316',
                  stroke: '#fff',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No history data available for this period
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* ZONE 3: FOOTER (Context) */}
      {/* ================================================================= */}
      <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
        {/* Time range pills */}
        <div className="flex gap-1">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
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

        {/* Right side info for Raw mode */}
        {viewMode === 'Raw' && (
          <div className="text-right">
            {/* PSA 10 Potential (only for Near Mint) */}
            {psa10Potential !== null && condition === 'Near Mint' && (
              <>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  PSA 10 Potential
                </div>
                <div className="text-lg font-semibold text-orange-600">
                  {formatCurrency(psa10Potential)}
                </div>
              </>
            )}
            {/* Volume for all conditions */}
            <div className="text-xs text-gray-400">
              {totalVolume} {totalVolume === 1 ? 'sale' : 'sales'} this period
            </div>
          </div>
        )}

        {/* Confidence indicator for graded view */}
        {viewMode === 'Graded' && (
          <div className="text-right">
            {priceData[grade]?.smartMarketPrice && (
              <div className="flex items-center gap-1.5 justify-end">
                <div
                  className={`w-2 h-2 rounded-full ${
                    priceData[grade]?.smartMarketPrice?.confidence === 'high'
                      ? 'bg-green-500'
                      : priceData[grade]?.smartMarketPrice?.confidence === 'medium'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-xs text-gray-500 capitalize">
                  {priceData[grade]?.smartMarketPrice?.confidence} confidence
                </span>
              </div>
            )}
            <div className="text-xs text-gray-400">
              {totalVolume} {totalVolume === 1 ? 'sale' : 'sales'} this period
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
