'use client';

import { useMemo } from 'react';
import type {
  PortfolioSnapshot,
  PortfolioTimeRange,
  LivePortfolioData,
} from '@/types/portfolio';
import {
  filterSnapshotsByTimeRange,
  calculatePercentChange,
  formatCurrency,
  formatPercentChange,
} from '@/utils/portfolioUtils';

interface PortfolioKPIRowProps {
  /** Historical snapshots for calculating trends */
  snapshots: PortfolioSnapshot[];
  /** Live data for current values (always accurate) */
  liveData: LivePortfolioData;
  timeRange: PortfolioTimeRange;
}

// Currency/Dollar icon for Net Worth
function CurrencyIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

// Stack/layers icon for Card Holdings
function StackIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.429 9.75 12 5.25l5.571 4.5M6.429 14.25 12 18.75l5.571-4.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 12 12 17.25 21.75 12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 7.5 12 12.75 21.75 7.5 12 2.25 2.25 7.5Z"
      />
    </svg>
  );
}

// Package/box icon for Sealed Inventory
function PackageIcon({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}

// Trend badge component matching PriceWidget pattern
function TrendBadge({ change }: { change: number | null }) {
  const { text, isPositive, isNegative } = formatPercentChange(change);

  if (change === null) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${
        isPositive
          ? 'bg-green-100 text-green-700'
          : isNegative
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isPositive && (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )}
      {isNegative && (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      )}
      {text}
    </span>
  );
}

// Enhanced stat card with trend support
function KPICard({
  icon,
  label,
  value,
  subText,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subText?: string;
  change: number | null;
}) {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-2xl">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-grey-500 font-medium">{label}</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-semibold text-grey-900">
                {value}
              </span>
              <TrendBadge change={change} />
            </div>
            {subText && (
              <p className="text-xs text-grey-400 mt-1">{subText}</p>
            )}
          </div>
          <div className="flex-shrink-0 ml-4 text-grey-400">{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioKPIRow({
  snapshots,
  liveData,
  timeRange,
}: PortfolioKPIRowProps) {
  // Calculate current values from liveData (always accurate)
  const currentValues = useMemo(() => {
    const cardValue = liveData.total_card_value;
    const sealedValue = liveData.total_product_value;
    return {
      netWorth: cardValue + sealedValue,
      cardValue,
      cardCount: liveData.card_count,
      sealedValue,
      sealedCount: liveData.product_count,
    };
  }, [liveData]);

  // Calculate trends by comparing liveData to first snapshot in time range
  const trends = useMemo(() => {
    const filtered = filterSnapshotsByTimeRange(snapshots, timeRange);

    if (filtered.length === 0) {
      // No historical data - no trends to show
      return {
        netWorthChange: null,
        cardValueChange: null,
        sealedValueChange: null,
      };
    }

    // Compare live values to first snapshot in the filtered range
    const firstSnapshot = filtered[0];
    const firstNetWorth =
      Number(firstSnapshot.total_card_value) +
      Number(firstSnapshot.total_product_value);
    const firstCardValue = Number(firstSnapshot.total_card_value);
    const firstSealedValue = Number(firstSnapshot.total_product_value);

    return {
      netWorthChange: calculatePercentChange([
        firstNetWorth,
        currentValues.netWorth,
      ]),
      cardValueChange: calculatePercentChange([
        firstCardValue,
        currentValues.cardValue,
      ]),
      sealedValueChange: calculatePercentChange([
        firstSealedValue,
        currentValues.sealedValue,
      ]),
    };
  }, [snapshots, timeRange, currentValues]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Net Worth - Primary metric */}
      <KPICard
        icon={<CurrencyIcon />}
        label="Net Worth"
        value={formatCurrency(currentValues.netWorth)}
        change={trends.netWorthChange}
      />

      {/* Card Holdings */}
      <KPICard
        icon={<StackIcon />}
        label="Card Holdings"
        value={formatCurrency(currentValues.cardValue)}
        subText={`${currentValues.cardCount.toLocaleString()} cards`}
        change={trends.cardValueChange}
      />

      {/* Sealed Inventory */}
      <KPICard
        icon={<PackageIcon />}
        label="Sealed Inventory"
        value={
          currentValues.sealedValue > 0
            ? formatCurrency(currentValues.sealedValue)
            : 'Coming Soon'
        }
        subText={
          currentValues.sealedCount > 0
            ? `${currentValues.sealedCount.toLocaleString()} products`
            : undefined
        }
        change={currentValues.sealedValue > 0 ? trends.sealedValueChange : null}
      />
    </div>
  );
}
