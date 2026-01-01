History Slicing Logic
The API returns up to 365 days of history per variant/condition. We pre-slice into time windows:
interface HistoryEntry {
  date: string;
  market: number;
  low: number;
  mid: number;
  high: number;
  volume?: number;
}

interface VariantConditionHistory {
  [variant: string]: {
    [condition: string]: HistoryEntry[];
  };
}

function sliceHistory(
  priceHistory: ApiPriceHistory,
  days: number
): VariantConditionHistory {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result: VariantConditionHistory = {};

  for (const [variant, conditions] of Object.entries(priceHistory.variants)) {
    result[variant] = {};
    for (const [condition, data] of Object.entries(conditions)) {
      result[variant][condition] = data.history.filter(
        h => new Date(h.date) >= cutoffDate
      );
    }
  }

  return result;
}

// Generate all time windows
raw_history_7d = sliceHistory(priceHistory, 7);
raw_history_30d = sliceHistory(priceHistory, 30);
raw_history_90d = sliceHistory(priceHistory, 90);
raw_history_180d = sliceHistory(priceHistory, 180);
raw_history_365d = sliceHistory(priceHistory, 365);

// Track what variants/conditions exist
raw_history_variants_tracked = Object.keys(raw_history_365d);
raw_history_conditions_tracked = [...new Set(
  Object.values(raw_history_365d).flatMap(v => Object.keys(v))
)];
Percent Change Calculation
function calcPercentChange(history: HistoryEntry[]): number | null {
  if (history.length < 2) return null;
  const oldest = history[0].market;
  const newest = history[history.length - 1].market;
  if (oldest === 0) return null;
  return ((newest - oldest) / oldest) * 100;
}

// Use primary variant's Near Mint for the main percent changes
const primaryHistory = raw_history_365d["Normal"]?.["Near Mint"]
  || raw_history_365d[Object.keys(raw_history_365d)[0]]?.["Near Mint"]
  || [];

change_7d_percent = calcPercentChange(primaryHistory.slice(-7));
change_30d_percent = calcPercentChange(primaryHistory.slice(-30));
change_90d_percent = calcPercentChange(primaryHistory.slice(-90));
change_180d_percent = calcPercentChange(primaryHistory.slice(-180));
change_365d_percent = calcPercentChange(primaryHistory);
PSA/Graded History (Client-Side Slicing)
The eBay graded price history is stored in ebay_price_history and is date-keyed (sparse data):
{
  "psa10": {
    "2025-11-01": {
      "average": 900,
      "count": 1,
      "totalValue": 900,
      "sevenDayAverage": 900,
      "sevenDayVolumeAvg": 1,
      "sevenDayValueAvg": 900,
      "rollingWindow": 1
    },
    "2025-12-20": {
      "average": 410,
      "count": 1,
      "totalValue": 410,
      "sevenDayAverage": 442.11,
      "sevenDayVolumeAvg": 1.29,
      "sevenDayValueAvg": 568.43,
      "rollingWindow": 7
    }
  },
  "psa9": {
    "2025-11-14": {
      "count": 9,
      "totalValue": 4182.12,
      "average": 464.68
    },
    "2025-12-21": {
      "average": 176.25,
      "count": 2,
      "totalValue": 352.5,
      "sevenDayAverage": 232.88,
      "sevenDayVolumeAvg": 1.14,
      "sevenDayValueAvg": 266.14,
      "rollingWindow": 7
    }
  }
}
Why client-side slicing for PSA history?
Sparse data (~50-100 entries/year per grade) - trivial payload
Avoids 15 extra JSONB columns (3 grades × 5 time windows)
Simple client-side filtering:
interface PsaHistoryEntry {
  average: number;
  count: number;
  totalValue: number;
  sevenDayAverage?: number;
  sevenDayVolumeAvg?: number;
  sevenDayValueAvg?: number;
  rollingWindow?: number;
}

function getPsaHistoryForPeriod(
  ebayPriceHistory: Record<string, Record<string, PsaHistoryEntry>>,
  grade: 'psa10' | 'psa9' | 'psa8',
  days: number
): { date: string } & PsaHistoryEntry[] {
  const history = ebayPriceHistory?.[grade] || {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return Object.entries(history)
    .filter(([date]) => new Date(date) >= cutoff)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}