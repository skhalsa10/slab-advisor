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
  } = usePriceWidget();

  const changeDisplay = formatPriceChange(priceChange);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ROW 1: Hero price + trend badge | Raw/Graded toggle */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Price + Trend */}
        <div className="flex items-baseline gap-2">
          {currentPrice !== null ? (
            <span className="text-4xl font-extrabold text-gray-900">
              {formatCurrency(currentPrice)}
            </span>
          ) : (
            <span className="text-xl font-medium text-gray-400">
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

        {/* Right: Raw/Graded Toggle */}
        {hasRaw && hasGraded && (
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('Raw')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'Raw'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Raw
            </button>
            <button
              onClick={() => setViewMode('Graded')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                viewMode === 'Graded'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Graded
            </button>
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
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
        ) : availableGrades.length > 1 ? (
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value as PsaGradeKey)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
        )}

        {/* PSA 10 Potential - inline with condition (shows upgrade path) */}
        {viewMode === 'Raw' && psa10Potential !== null && condition === 'Near Mint' && (
          <div className="flex items-center gap-2 border-l-2 border-green-500 pl-3 py-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
