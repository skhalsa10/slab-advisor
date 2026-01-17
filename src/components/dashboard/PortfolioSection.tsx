'use client';

import { useState } from 'react';
import type {
  PortfolioSnapshot,
  PortfolioTimeRange,
  LivePortfolioData,
} from '@/types/portfolio';
import PortfolioKPIRow from './PortfolioKPIRow';
import PortfolioChart from './PortfolioChart';
import PortfolioEmptyState from './PortfolioEmptyState';

interface PortfolioSectionProps {
  /** Historical snapshots from nightly cron job */
  snapshots: PortfolioSnapshot[];
  /** Live/real-time data calculated from collection_cards */
  liveData: LivePortfolioData;
}

/**
 * Client wrapper for the portfolio section of the dashboard.
 * Manages shared time range state between KPI row and chart.
 *
 * Data sources:
 * - snapshots: Historical data from portfolio_snapshots table (nightly cron)
 * - liveData: Real-time calculation from collection_cards (always current)
 *
 * KPIs use liveData for values (always accurate).
 * Chart uses snapshots + liveData appended as "today".
 */
export default function PortfolioSection({
  snapshots,
  liveData,
}: PortfolioSectionProps) {
  const [timeRange, setTimeRange] = useState<PortfolioTimeRange>('1M');

  // Show empty state only if user has no cards at all (no snapshots AND no live data)
  const hasNoData = snapshots.length === 0 && liveData.card_count === 0;
  if (hasNoData) {
    return <PortfolioEmptyState />;
  }

  return (
    <>
      <PortfolioKPIRow
        snapshots={snapshots}
        liveData={liveData}
        timeRange={timeRange}
      />
      <PortfolioChart
        snapshots={snapshots}
        liveData={liveData}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </>
  );
}
