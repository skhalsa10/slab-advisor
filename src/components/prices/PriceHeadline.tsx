'use client';

import { usePriceWidget } from './PriceWidgetContext';
import {
  formatCurrency,
  formatPriceChange,
  gradeKeyToLabel,
} from '@/utils/priceHistoryUtils';
import type { PsaGradeKey } from '@/types/prices';

interface PriceHeadlineProps {
  className?: string;
}

/**
 * Standalone price headline component that displays key pricing info above the fold.
 *
 * Layout:
 * - Row 1: Hero price + trend badge | Raw/Graded toggle
 * - Row 2: Condition/Grade dropdown | PSA 10 Potential widget (Raw mode only)
 *
 * Must be used inside a PriceWidgetProvider.
 */
export function PriceHeadline({ className = '' }: PriceHeadlineProps) {
  const {
    viewMode,
    setViewMode,
    condition,
    setCondition,
    grade,
    setGrade,
    availableConditions,
    availableGrades,
    hasRaw,
    hasGraded,
    currentPrice,
    priceChange,
    psa10Potential,
    selectedVariant,
    hasPatternVariants,
  } = usePriceWidget();

  const changeDisplay = formatPriceChange(priceChange);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ROW 1: Hero price + trend badge | Raw/Graded toggle */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Price + Trend - wraps when needed */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 min-w-0">
          {currentPrice !== null ? (
            <span className="text-4xl font-extrabold text-foreground">
              {formatCurrency(currentPrice)}
            </span>
          ) : (
            <span className="text-xl font-medium text-muted-foreground">
              No price available
            </span>
          )}
          {priceChange !== null && (
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-sm font-medium ${
                changeDisplay.isPositive
                  ? 'bg-green-100 text-green-700'
                  : changeDisplay.isNegative
                  ? 'bg-red-100 text-red-700'
                  : 'bg-muted text-muted-foreground'
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

        {/* Right: Raw/Graded Toggle + Variant indicator */}
        {hasRaw && hasGraded && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('Raw')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'Raw'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Raw
              </button>
              <button
                onClick={() => setViewMode('Graded')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === 'Graded'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'bg-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Graded
              </button>
            </div>
            {/* Show variant name under toggle when in Graded mode (so user knows which variant's graded prices they're seeing) */}
            {viewMode === 'Graded' && hasPatternVariants && (
              <span className="text-xs text-muted-foreground">
                {selectedVariant.displayName}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ROW 2: Condition/Grade dropdown + PSA 10 Potential (grouped together) */}
      <div className="flex items-center gap-4">
        {/* Condition/Grade Dropdown */}
        {viewMode === 'Raw' ? (
          availableConditions.length > 1 ? (
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            >
              {availableConditions.map((cond) => (
                <option key={cond} value={cond}>
                  {cond}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-muted-foreground">{condition}</span>
          )
        ) : availableGrades.length > 1 ? (
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as PsaGradeKey)}
            className="text-sm border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            {availableGrades.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-muted-foreground">
            {gradeKeyToLabel(grade)}
          </span>
        )}

        {/* PSA 10 Potential - inline with condition (shows upgrade path) */}
        {viewMode === 'Raw' && psa10Potential !== null && condition === 'Near Mint' && (
          <div className="flex items-center gap-2 border-l-2 border-green-500 pl-3 py-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              PSA 10
            </span>
            <span className="text-sm font-semibold text-green-600">
              {formatCurrency(psa10Potential)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
