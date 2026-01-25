import { describe, it, expect } from 'vitest'
import { getConditionsForVariant, getDefaultCondition } from './priceHistoryUtils'
import type { PokemonCardPrices } from '@/types/prices'

/**
 * Helper to create a minimal PokemonCardPrices mock.
 * Only includes fields relevant to condition logic.
 */
function makePriceData(
  overrides: Partial<PokemonCardPrices> = {}
): PokemonCardPrices {
  return {
    id: 'test-id',
    pokemon_card_id: 'test-card',
    tcgplayer_product_id: null,
    current_market_price: null,
    current_market_price_condition: null,
    psa10: null,
    psa9: null,
    psa8: null,
    change_7d_percent: null,
    change_30d_percent: null,
    change_90d_percent: null,
    change_180d_percent: null,
    change_365d_percent: null,
    prices_raw: null,
    ebay_price_history: null,
    raw_price_history: null,
    raw_history_variants_tracked: null,
    raw_history_conditions_tracked: null,
    last_updated: null,
    created_at: null,
    ...overrides,
  } as PokemonCardPrices
}

describe('getConditionsForVariant', () => {
  it('returns conditions for a specific variant from raw_price_history', () => {
    const priceData = makePriceData({
      raw_price_history: {
        'Normal': {
          'Near Mint': [{ date: '2025-01-01', market: 1.0, low: 0.8, mid: 0.9, high: 1.1 }],
          'Lightly Played': [{ date: '2025-01-01', market: 0.8, low: 0.6, mid: 0.7, high: 0.9 }],
        },
        'Reverse Holofoil': {
          'Lightly Played': [{ date: '2025-01-01', market: 0.5, low: 0.4, mid: 0.45, high: 0.6 }],
        },
      },
      raw_history_conditions_tracked: ['Near Mint', 'Lightly Played'],
    })

    expect(getConditionsForVariant(priceData, 'Normal')).toEqual([
      'Near Mint',
      'Lightly Played',
    ])
    expect(getConditionsForVariant(priceData, 'Reverse Holofoil')).toEqual([
      'Lightly Played',
    ])
  })

  it('falls back to raw_history_conditions_tracked when variant is not in 365d', () => {
    const priceData = makePriceData({
      raw_price_history: {
        'Normal': {
          'Near Mint': [{ date: '2025-01-01', market: 1.0, low: 0.8, mid: 0.9, high: 1.1 }],
        },
      },
      raw_history_conditions_tracked: ['Near Mint', 'Lightly Played'],
    })

    expect(getConditionsForVariant(priceData, 'Holofoil')).toEqual([
      'Near Mint',
      'Lightly Played',
    ])
  })

  it('falls back to raw_history_conditions_tracked when 365d is null', () => {
    const priceData = makePriceData({
      raw_price_history: null,
      raw_history_conditions_tracked: ['Near Mint', 'Moderately Played'],
    })

    expect(getConditionsForVariant(priceData, 'Normal')).toEqual([
      'Near Mint',
      'Moderately Played',
    ])
  })

  it('returns empty array when no data exists', () => {
    const priceData = makePriceData({
      raw_price_history: null,
      raw_history_conditions_tracked: null,
    })

    expect(getConditionsForVariant(priceData, 'Normal')).toEqual([])
  })

  it('handles raw_price_history stored as JSON string', () => {
    const historyObj = {
      'Holofoil': {
        'Near Mint': [{ date: '2025-01-01', market: 5.0, low: 4.0, mid: 4.5, high: 5.5 }],
        'Heavily Played': [{ date: '2025-01-01', market: 2.0, low: 1.5, mid: 1.8, high: 2.2 }],
      },
    }
    const priceData = makePriceData({
      // Simulate JSONB stored as string
      raw_price_history: JSON.stringify(historyObj) as unknown as null,
      raw_history_conditions_tracked: ['Near Mint'],
    })

    expect(getConditionsForVariant(priceData, 'Holofoil')).toEqual([
      'Near Mint',
      'Heavily Played',
    ])
  })

  it('falls back when variant has empty conditions in 365d', () => {
    const priceData = makePriceData({
      raw_price_history: {
        'Normal': {},
      },
      raw_history_conditions_tracked: ['Near Mint'],
    })

    expect(getConditionsForVariant(priceData, 'Normal')).toEqual(['Near Mint'])
  })
})

describe('getDefaultCondition', () => {
  it('returns Near Mint when available for variant', () => {
    const priceData = makePriceData({
      raw_price_history: {
        'Normal': {
          'Near Mint': [{ date: '2025-01-01', market: 1.0, low: 0.8, mid: 0.9, high: 1.1 }],
          'Lightly Played': [{ date: '2025-01-01', market: 0.8, low: 0.6, mid: 0.7, high: 0.9 }],
        },
      },
    })

    expect(getDefaultCondition(priceData, 'Normal')).toBe('Near Mint')
  })

  it('returns first condition when Near Mint is not available for variant', () => {
    const priceData = makePriceData({
      raw_price_history: {
        'Reverse Holofoil': {
          'Lightly Played': [{ date: '2025-01-01', market: 0.5, low: 0.4, mid: 0.45, high: 0.6 }],
          'Moderately Played': [{ date: '2025-01-01', market: 0.3, low: 0.2, mid: 0.25, high: 0.35 }],
        },
      },
    })

    expect(getDefaultCondition(priceData, 'Reverse Holofoil')).toBe('Lightly Played')
  })

  it('works without variantKey (backward compatible)', () => {
    const priceData = makePriceData({
      raw_history_conditions_tracked: ['Lightly Played', 'Moderately Played'],
    })

    expect(getDefaultCondition(priceData)).toBe('Lightly Played')
  })

  it('returns Near Mint default when no data exists', () => {
    const priceData = makePriceData()

    expect(getDefaultCondition(priceData, 'Normal')).toBe('Near Mint')
    expect(getDefaultCondition(priceData)).toBe('Near Mint')
  })
})
