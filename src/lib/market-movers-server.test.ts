import { describe, it, expect } from 'vitest'
import { compute24hChange } from './market-movers-server'
import type { VariantConditionHistory } from '@/types/prices'

describe('compute24hChange', () => {
  it('returns correct percentage for a positive price increase', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-12', market: 10.0, low: 9, mid: 10, high: 11 },
          { date: '2026-02-13', market: 12.0, low: 11, mid: 12, high: 13 },
        ],
      },
    }

    const result = compute24hChange(history)
    expect(result).toBeCloseTo(20.0, 1) // (12 - 10) / 10 * 100 = 20%
  })

  it('returns correct percentage for a price decrease', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-12', market: 100.0, low: 90, mid: 100, high: 110 },
          { date: '2026-02-13', market: 90.0, low: 80, mid: 90, high: 100 },
        ],
      },
    }

    const result = compute24hChange(history)
    expect(result).toBeCloseTo(-10.0, 1) // (90 - 100) / 100 * 100 = -10%
  })

  it('returns null for null history', () => {
    expect(compute24hChange(null)).toBeNull()
  })

  it('returns null for empty object', () => {
    expect(compute24hChange({} as VariantConditionHistory)).toBeNull()
  })

  it('returns null for single entry (needs at least 2)', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-13', market: 10.0, low: 9, mid: 10, high: 11 },
        ],
      },
    }

    expect(compute24hChange(history)).toBeNull()
  })

  it('returns null when entries are more than 2 days apart', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-01', market: 10.0, low: 9, mid: 10, high: 11 },
          { date: '2026-02-13', market: 12.0, low: 11, mid: 12, high: 13 },
        ],
      },
    }

    expect(compute24hChange(history)).toBeNull()
  })

  it('returns null when previous market price is zero (division by zero)', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-12', market: 0, low: 0, mid: 0, high: 0 },
          { date: '2026-02-13', market: 10.0, low: 9, mid: 10, high: 11 },
        ],
      },
    }

    expect(compute24hChange(history)).toBeNull()
  })

  it('returns null when previous market price is negative', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-12', market: -5, low: 0, mid: 0, high: 0 },
          { date: '2026-02-13', market: 10.0, low: 9, mid: 10, high: 11 },
        ],
      },
    }

    expect(compute24hChange(history)).toBeNull()
  })

  it('prefers "Normal" variant over others', () => {
    const history: VariantConditionHistory = {
      'Reverse Holofoil': {
        'Near Mint': [
          { date: '2026-02-12', market: 5.0, low: 4, mid: 5, high: 6 },
          { date: '2026-02-13', market: 6.0, low: 5, mid: 6, high: 7 },
        ],
      },
      Normal: {
        'Near Mint': [
          { date: '2026-02-12', market: 10.0, low: 9, mid: 10, high: 11 },
          { date: '2026-02-13', market: 15.0, low: 14, mid: 15, high: 16 },
        ],
      },
    }

    const result = compute24hChange(history)
    expect(result).toBeCloseTo(50.0, 1) // (15 - 10) / 10 * 100 = 50% (from Normal)
  })

  it('falls back to first available variant if "Normal" is not present', () => {
    const history: VariantConditionHistory = {
      Holofoil: {
        'Near Mint': [
          { date: '2026-02-12', market: 20.0, low: 18, mid: 20, high: 22 },
          { date: '2026-02-13', market: 25.0, low: 23, mid: 25, high: 27 },
        ],
      },
    }

    const result = compute24hChange(history)
    expect(result).toBeCloseTo(25.0, 1) // (25 - 20) / 20 * 100 = 25%
  })

  it('prefers "Near Mint" condition over others', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Lightly Played': [
          { date: '2026-02-12', market: 5.0, low: 4, mid: 5, high: 6 },
          { date: '2026-02-13', market: 6.0, low: 5, mid: 6, high: 7 },
        ],
        'Near Mint': [
          { date: '2026-02-12', market: 10.0, low: 9, mid: 10, high: 11 },
          { date: '2026-02-13', market: 12.0, low: 11, mid: 12, high: 13 },
        ],
      },
    }

    const result = compute24hChange(history)
    expect(result).toBeCloseTo(20.0, 1) // (12 - 10) / 10 * 100 = 20% (from Near Mint)
  })

  it('sorts entries by date and uses the last two', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-13', market: 15.0, low: 14, mid: 15, high: 16 },
          { date: '2026-02-11', market: 8.0, low: 7, mid: 8, high: 9 },
          { date: '2026-02-12', market: 10.0, low: 9, mid: 10, high: 11 },
        ],
      },
    }

    // Should sort to [2026-02-11, 2026-02-12, 2026-02-13] and compare last two
    const result = compute24hChange(history)
    expect(result).toBeCloseTo(50.0, 1) // (15 - 10) / 10 * 100 = 50%
  })

  it('returns 0 when prices are the same', () => {
    const history: VariantConditionHistory = {
      Normal: {
        'Near Mint': [
          { date: '2026-02-12', market: 10.0, low: 9, mid: 10, high: 11 },
          { date: '2026-02-13', market: 10.0, low: 9, mid: 10, high: 11 },
        ],
      },
    }

    const result = compute24hChange(history)
    expect(result).toBeCloseTo(0, 1)
  })
})
