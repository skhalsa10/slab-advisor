'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type {
  PokemonCardPrices,
  CombinedCardPrices,
  VariantOption,
  TimeRange,
  ViewMode,
  PsaGradeKey,
  ChartDataPoint,
} from '@/types/prices';
import {
  hasRawHistory,
  hasGradedData,
  getDefaultCondition,
  getDefaultGrade,
  getRawHistoryForTimeRange,
  transformRawHistoryToChartData,
  getPsaHistoryForPeriod,
  timeRangeToDays,
} from '@/utils/priceHistoryUtils';

// Key used for base variant records (null pattern stored as '_base' in Record)
const BASE_PATTERN_KEY = '_base';

// =============================================================================
// Context Types
// =============================================================================

interface PriceWidgetContextValue {
  // Active price record (changes based on selected variant)
  priceData: PokemonCardPrices;

  // Combined data (all records)
  combinedPrices: CombinedCardPrices;

  // UI State
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  selectedVariant: VariantOption;
  setSelectedVariant: (variant: VariantOption) => void;
  condition: string;
  setCondition: (condition: string) => void;
  grade: PsaGradeKey;
  setGrade: (grade: PsaGradeKey) => void;

  // Derived values
  availableVariants: VariantOption[];
  availableConditions: string[];
  availableGrades: { value: PsaGradeKey; label: string }[];
  hasRaw: boolean;
  hasGraded: boolean;
  hasPatternVariants: boolean;

  // Computed price values (for PriceHeadline)
  chartData: ChartDataPoint[];
  currentPrice: number | null;
  priceChange: number | null;
  psa10Potential: number | null;

  // Legacy compatibility - variant as string (display name)
  variant: string;
  setVariant: (displayName: string) => void;
}

// =============================================================================
// Context
// =============================================================================

const PriceWidgetContext = createContext<PriceWidgetContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

interface PriceWidgetProviderProps {
  priceData: CombinedCardPrices;
  children: ReactNode;
}

const PSA_GRADES: { value: PsaGradeKey; label: string }[] = [
  { value: 'psa10', label: 'PSA 10' },
  { value: 'psa9', label: 'PSA 9' },
  { value: 'psa8', label: 'PSA 8' },
];

export function PriceWidgetProvider({
  priceData: combinedPrices,
  children,
}: PriceWidgetProviderProps) {
  // Get default variant (first available)
  const defaultVariant = useMemo(() => {
    if (combinedPrices.allVariants.length > 0) {
      return combinedPrices.allVariants[0];
    }
    // Fallback if no variants tracked
    return {
      displayName: 'Normal',
      variantKey: 'Normal',
      sourcePattern: null,
    };
  }, [combinedPrices.allVariants]);

  // Get the initial record based on the default variant
  const initialRecord = useMemo(() => {
    const recordKey = defaultVariant.sourcePattern || BASE_PATTERN_KEY;
    return combinedPrices.records[recordKey] || combinedPrices.primaryRecord;
  }, [combinedPrices, defaultVariant]);

  // UI State - initialized with smart defaults based on the INITIAL record (not primary)
  const [viewMode, setViewMode] = useState<ViewMode>('Raw');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedVariant, setSelectedVariant] = useState<VariantOption>(defaultVariant);
  const [condition, setCondition] = useState(() =>
    getDefaultCondition(initialRecord)
  );
  const [grade, setGrade] = useState<PsaGradeKey>(() =>
    getDefaultGrade(initialRecord)
  );

  // Get active price record based on selected variant's source pattern
  const activePriceRecord = useMemo(() => {
    const recordKey = selectedVariant.sourcePattern || BASE_PATTERN_KEY;
    return combinedPrices.records[recordKey] || combinedPrices.primaryRecord;
  }, [combinedPrices, selectedVariant]);

  // Derived values from active record
  const hasRaw = useMemo(() => hasRawHistory(activePriceRecord), [activePriceRecord]);
  const hasGraded = useMemo(() => hasGradedData(activePriceRecord), [activePriceRecord]);

  // Available variants from all records (combined)
  const availableVariants = useMemo(
    () => combinedPrices.allVariants,
    [combinedPrices.allVariants]
  );

  // Available conditions from active record
  const availableConditions = useMemo(
    () => activePriceRecord.raw_history_conditions_tracked || [],
    [activePriceRecord]
  );

  // Reset condition when active record changes (to ensure valid condition for new record)
  // This handles switching between pattern variants that may have different conditions
  useEffect(() => {
    const newConditions = activePriceRecord.raw_history_conditions_tracked || [];
    if (newConditions.length > 0 && !newConditions.includes(condition)) {
      // Current condition not available in new record, reset to default
      const newCondition = newConditions.includes('Near Mint') ? 'Near Mint' : newConditions[0];
      setCondition(newCondition);
    }
  }, [activePriceRecord, condition]);

  // Available grades from active record
  const availableGrades = useMemo(
    () => PSA_GRADES.filter((g) => activePriceRecord[g.value] !== null),
    [activePriceRecord]
  );

  // Chart data based on current view mode - uses active record
  const rawChartData: ChartDataPoint[] = useMemo(() => {
    if (viewMode === 'Raw') {
      const history = getRawHistoryForTimeRange(activePriceRecord, timeRange);
      // Use variantKey (the actual key in raw_history) not displayName
      return transformRawHistoryToChartData(history, selectedVariant.variantKey, condition);
    } else {
      return getPsaHistoryForPeriod(
        activePriceRecord.ebay_price_history,
        grade,
        timeRangeToDays(timeRange)
      );
    }
  }, [viewMode, timeRange, selectedVariant, condition, grade, activePriceRecord]);

  // Handle single data point by creating a flat line
  // For graded view, append today's smart market price so chart ends at displayed price
  const chartData: ChartDataPoint[] = useMemo(() => {
    let data = rawChartData;

    // For graded view, add today's data point with smart market price
    if (viewMode === 'Graded' && data.length > 0) {
      const gradeData = activePriceRecord[grade];
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
  }, [rawChartData, timeRange, viewMode, grade, activePriceRecord]);

  // Current price display
  const currentPrice = useMemo(() => {
    if (viewMode === 'Raw') {
      if (chartData.length > 0) {
        return chartData[chartData.length - 1].value;
      }
      return null;
    } else {
      const gradeData = activePriceRecord[grade];
      return gradeData?.smartMarketPrice?.price ?? gradeData?.avgPrice ?? null;
    }
  }, [viewMode, grade, activePriceRecord, chartData]);

  // Calculate price change from chart data
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;

    const firstValue = chartData[0].value;
    const lastValue = chartData[chartData.length - 1].value;

    if (firstValue === 0) return null;

    return ((lastValue - firstValue) / firstValue) * 100;
  }, [chartData]);

  // PSA 10 potential from active record
  const psa10Potential = useMemo(
    () =>
      activePriceRecord.psa10?.smartMarketPrice?.price ??
      activePriceRecord.psa10?.avgPrice ??
      null,
    [activePriceRecord]
  );

  // Legacy compatibility: setVariant by display name
  const setVariantByDisplayName = useCallback(
    (displayName: string) => {
      const found = combinedPrices.allVariants.find(
        (v) => v.displayName === displayName
      );
      if (found) {
        setSelectedVariant(found);
      }
    },
    [combinedPrices.allVariants]
  );

  const value = useMemo<PriceWidgetContextValue>(
    () => ({
      priceData: activePriceRecord,
      combinedPrices,
      viewMode,
      setViewMode,
      timeRange,
      setTimeRange,
      selectedVariant,
      setSelectedVariant,
      condition,
      setCondition,
      grade,
      setGrade,
      availableVariants,
      availableConditions,
      availableGrades,
      hasRaw,
      hasGraded,
      hasPatternVariants: combinedPrices.hasPatternVariants,
      chartData,
      currentPrice,
      priceChange,
      psa10Potential,
      // Legacy compatibility
      variant: selectedVariant.displayName,
      setVariant: setVariantByDisplayName,
    }),
    [
      activePriceRecord,
      combinedPrices,
      viewMode,
      timeRange,
      selectedVariant,
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
      setVariantByDisplayName,
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
