'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  PokemonCardPrices,
  TimeRange,
  ViewMode,
  PsaGradeKey,
  ChartDataPoint,
} from '@/types/prices';
import {
  hasRawHistory,
  hasGradedData,
  getDefaultVariant,
  getDefaultCondition,
  getDefaultGrade,
  getRawHistoryForTimeRange,
  transformRawHistoryToChartData,
  getPsaHistoryForPeriod,
  timeRangeToDays,
} from '@/utils/priceHistoryUtils';

// =============================================================================
// Context Types
// =============================================================================

interface PriceWidgetContextValue {
  // Price data (read-only)
  priceData: PokemonCardPrices;

  // UI State
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  variant: string;
  setVariant: (variant: string) => void;
  condition: string;
  setCondition: (condition: string) => void;
  grade: PsaGradeKey;
  setGrade: (grade: PsaGradeKey) => void;

  // Derived values
  availableVariants: string[];
  availableConditions: string[];
  availableGrades: { value: PsaGradeKey; label: string }[];
  hasRaw: boolean;
  hasGraded: boolean;

  // Computed price values (for PriceHeadline)
  chartData: ChartDataPoint[];
  currentPrice: number | null;
  priceChange: number | null;
  psa10Potential: number | null;
}

// =============================================================================
// Context
// =============================================================================

const PriceWidgetContext = createContext<PriceWidgetContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface PriceWidgetProviderProps {
  priceData: PokemonCardPrices;
  children: ReactNode;
}

const PSA_GRADES: { value: PsaGradeKey; label: string }[] = [
  { value: 'psa10', label: 'PSA 10' },
  { value: 'psa9', label: 'PSA 9' },
  { value: 'psa8', label: 'PSA 8' },
];

export function PriceWidgetProvider({
  priceData,
  children,
}: PriceWidgetProviderProps) {
  // UI State - initialized with smart defaults
  const [viewMode, setViewMode] = useState<ViewMode>('Raw');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [variant, setVariant] = useState(() => getDefaultVariant(priceData));
  const [condition, setCondition] = useState(() => getDefaultCondition(priceData));
  const [grade, setGrade] = useState<PsaGradeKey>(() => getDefaultGrade(priceData));

  // Derived values
  const hasRaw = useMemo(() => hasRawHistory(priceData), [priceData]);
  const hasGraded = useMemo(() => hasGradedData(priceData), [priceData]);
  const availableVariants = useMemo(
    () => priceData.raw_history_variants_tracked || [],
    [priceData]
  );
  const availableConditions = useMemo(
    () => priceData.raw_history_conditions_tracked || [],
    [priceData]
  );
  const availableGrades = useMemo(
    () => PSA_GRADES.filter((g) => priceData[g.value] !== null),
    [priceData]
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
  // For graded view, append today's smart market price so chart ends at displayed price
  const chartData: ChartDataPoint[] = useMemo(() => {
    let data = rawChartData;

    // For graded view, add today's data point with smart market price
    if (viewMode === 'Graded' && data.length > 0) {
      const gradeData = priceData[grade];
      const smartPrice = gradeData?.smartMarketPrice?.price ?? gradeData?.avgPrice;

      if (smartPrice !== null && smartPrice !== undefined) {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = data[data.length - 1].date;

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

  // Current price display
  const currentPrice = useMemo(() => {
    if (viewMode === 'Raw') {
      if (chartData.length > 0) {
        return chartData[chartData.length - 1].value;
      }
      return null;
    } else {
      const gradeData = priceData[grade];
      return gradeData?.smartMarketPrice?.price ?? gradeData?.avgPrice ?? null;
    }
  }, [viewMode, grade, priceData, chartData]);

  // Calculate price change from chart data
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;

    if (firstValue === 0) return null;

    return ((lastValue - firstValue) / firstValue) * 100;
  }, [chartData]);

  // PSA 10 potential
  const psa10Potential = useMemo(
    () => priceData.psa10?.smartMarketPrice?.price ?? priceData.psa10?.avgPrice ?? null,
    [priceData]
  );

  const value = useMemo<PriceWidgetContextValue>(
    () => ({
      priceData,
      viewMode,
      setViewMode,
      timeRange,
      setTimeRange,
      variant,
      setVariant,
      condition,
      setCondition,
      grade,
      setGrade,
      availableVariants,
      availableConditions,
      availableGrades,
      hasRaw,
      hasGraded,
      chartData,
      currentPrice,
      priceChange,
      psa10Potential,
    }),
    [
      priceData,
      viewMode,
      timeRange,
      variant,
      condition,
      grade,
      availableVariants,
      availableConditions,
      availableGrades,
      hasRaw,
      hasGraded,
      chartData,
      currentPrice,
      priceChange,
      psa10Potential,
    ]
  );

  return (
    <PriceWidgetContext.Provider value={value}>
      {children}
    </PriceWidgetContext.Provider>
  );
}

// =============================================================================
// Consumer Hook
// =============================================================================

/**
 * Hook to access price widget state from context.
 * Returns null if not inside a PriceWidgetProvider (for backward compatibility).
 */
export function usePriceWidgetContext(): PriceWidgetContextValue | null {
  return useContext(PriceWidgetContext);
}

/**
 * Hook to access price widget state, throws if not inside Provider.
 * Use this when the component requires the context to function.
 */
export function usePriceWidget(): PriceWidgetContextValue {
  const context = useContext(PriceWidgetContext);
  if (!context) {
    throw new Error('usePriceWidget must be used within a PriceWidgetProvider');
  }
  return context;
}
