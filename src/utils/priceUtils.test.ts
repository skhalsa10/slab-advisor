import { describe, it, expect } from 'vitest'
import {
  extractMarketPrices,
  getDisplayPrice,
  getBestPrice,
  getVariantPrice,
  getPriceRange,
  formatPriceRange,
  getSmartDisplayPrice
} from './priceUtils'

describe('priceUtils', () => {
  describe('extractMarketPrices', () => {
    it('should extract prices from valid array data', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Holofoil', marketPrice: 1.30 }
      ]
      const result = extractMarketPrices(priceData)
      expect(result).toEqual({
        'Normal': 0.15,
        'Holofoil': 1.30
      })
    })

    it('should handle string JSON data', () => {
      const priceData = JSON.stringify([
        { subTypeName: 'Normal', marketPrice: 0.15 }
      ])
      const result = extractMarketPrices(priceData)
      expect(result).toEqual({ 'Normal': 0.15 })
    })

    it('should return null for invalid data', () => {
      expect(extractMarketPrices(null)).toBeNull()
      expect(extractMarketPrices(undefined)).toBeNull()
      expect(extractMarketPrices({})).toBeNull()
      expect(extractMarketPrices([])).toBeNull()
    })

    it('should filter out invalid price entries', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Invalid' }, // Missing marketPrice
        { marketPrice: 1.30 } // Missing subTypeName
      ]
      const result = extractMarketPrices(priceData)
      expect(result).toEqual({ 'Normal': 0.15 })
    })
  })

  describe('getDisplayPrice', () => {
    it('should prefer Normal variant', () => {
      const prices = {
        'Normal': 0.15,
        'Holofoil': 1.30
      }
      expect(getDisplayPrice(prices)).toBe('$0.15')
    })

    it('should fallback to first variant if Normal not available', () => {
      const prices = {
        'Holofoil': 1.30,
        'Reverse Holofoil': 0.26
      }
      expect(getDisplayPrice(prices)).toBe('$1.30')
    })

    it('should return null for no prices', () => {
      expect(getDisplayPrice(null)).toBeNull()
      expect(getDisplayPrice({})).toBeNull()
    })

    it('should skip zero prices', () => {
      const prices = {
        'Normal': 0,
        'Holofoil': 1.30
      }
      expect(getDisplayPrice(prices)).toBe('$1.30')
    })
  })

  describe('getBestPrice', () => {
    it('should return the lowest price', () => {
      const prices = {
        'Normal': 0.15,
        'Holofoil': 1.30,
        'Master Ball': 20.42
      }
      expect(getBestPrice(prices)).toBe(0.15)
    })

    it('should exclude zero prices', () => {
      const prices = {
        'Normal': 0,
        'Holofoil': 1.30
      }
      expect(getBestPrice(prices)).toBe(1.30)
    })

    it('should return null for no valid prices', () => {
      expect(getBestPrice(null)).toBeNull()
      expect(getBestPrice({})).toBeNull()
      expect(getBestPrice({ 'Normal': 0 })).toBeNull()
    })
  })

  describe('getVariantPrice', () => {
    it('should return price for specific variant', () => {
      const prices = {
        'Normal': 0.15,
        'Holofoil': 1.30
      }
      expect(getVariantPrice(prices, 'Normal')).toBe(0.15)
      expect(getVariantPrice(prices, 'Holofoil')).toBe(1.30)
    })

    it('should return null for non-existent variant', () => {
      const prices = { 'Normal': 0.15 }
      expect(getVariantPrice(prices, 'Holofoil')).toBeNull()
    })

    it('should return null for zero price', () => {
      const prices = { 'Normal': 0 }
      expect(getVariantPrice(prices, 'Normal')).toBeNull()
    })

    it('should handle null prices', () => {
      expect(getVariantPrice(null, 'Normal')).toBeNull()
    })
  })

  describe('getPriceRange', () => {
    it('should calculate price range correctly', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Holofoil', marketPrice: 1.30 },
        { subTypeName: 'Master Ball', marketPrice: 20.42 }
      ]
      const result = getPriceRange(priceData)
      expect(result).toEqual({
        min: 0.15,
        max: 20.42,
        hasRange: true,
        variantCount: 3,
        priceSpread: ((20.42 - 0.15) / 0.15) * 100
      })
    })

    it('should handle single price', () => {
      const priceData = [{ subTypeName: 'Normal', marketPrice: 0.15 }]
      const result = getPriceRange(priceData)
      expect(result).toEqual({
        min: 0.15,
        max: 0.15,
        hasRange: false,
        variantCount: 1,
        priceSpread: 0
      })
    })

    it('should return null for no valid prices', () => {
      expect(getPriceRange(null)).toBeNull()
      expect(getPriceRange([])).toBeNull()
      expect(getPriceRange([{ subTypeName: 'Normal', marketPrice: 0 }])).toBeNull()
    })
  })

  describe('formatPriceRange', () => {
    it('should format range with variant count', () => {
      const priceRange = {
        min: 0.15,
        max: 20.42,
        hasRange: true,
        variantCount: 4,
        priceSpread: 13513.33
      }
      const result = formatPriceRange(priceRange)
      expect(result).toBe('$0.15 - $20.42 •4')
    })

    it('should format single price without range', () => {
      const priceRange = {
        min: 0.15,
        max: 0.15,
        hasRange: false,
        variantCount: 1,
        priceSpread: 0
      }
      const result = formatPriceRange(priceRange)
      expect(result).toBe('$0.15')
    })

    it('should use mobile abbreviation when requested', () => {
      const priceRange = {
        min: 0.15,
        max: 20.42,
        hasRange: true,
        variantCount: 4,
        priceSpread: 13513.33
      }
      const result = formatPriceRange(priceRange, { abbreviateMobile: true })
      expect(result).toBe('$0.15 - $20.42(4x)')
    })

    it('should hide variant count when requested', () => {
      const priceRange = {
        min: 0.15,
        max: 20.42,
        hasRange: true,
        variantCount: 4,
        priceSpread: 13513.33
      }
      const result = formatPriceRange(priceRange, { showVariantCount: false })
      expect(result).toBe('$0.15 - $20.42')
    })

    it('should handle null input', () => {
      expect(formatPriceRange(null)).toBeNull()
    })
  })

  describe('getSmartDisplayPrice', () => {
    it('should show range for high variance', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Master Ball', marketPrice: 20.42 }
      ]
      const result = getSmartDisplayPrice(priceData)
      expect(result).toBe('$0.15 - $20.42 •2')
    })

    it('should show single price for low variance', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Holofoil', marketPrice: 0.20 }
      ]
      const result = getSmartDisplayPrice(priceData)
      expect(result).toBe('$0.15 •2')
    })

    it('should force single mode when requested', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Master Ball', marketPrice: 20.42 }
      ]
      const result = getSmartDisplayPrice(priceData, { mode: 'single' })
      expect(result).toBe('$0.15')
    })

    it('should force range mode when requested', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Holofoil', marketPrice: 0.20 }
      ]
      const result = getSmartDisplayPrice(priceData, { mode: 'range' })
      expect(result).toBe('$0.15 - $0.20 •2')
    })

    it('should use "from" prefix when requested', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Master Ball', marketPrice: 20.42 }
      ]
      const result = getSmartDisplayPrice(priceData, { mode: 'from' })
      expect(result).toBe('From $0.15 - $20.42 •2')
    })

    it('should respect custom thresholds', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 1.00 },
        { subTypeName: 'Holofoil', marketPrice: 2.50 }
      ]
      // 150% variance, $1.50 difference
      const result1 = getSmartDisplayPrice(priceData, { varianceThreshold: 100 })
      expect(result1).toBe('$1.00 - $2.50 •2')

      const result2 = getSmartDisplayPrice(priceData, { priceThreshold: 1 })
      expect(result2).toBe('$1.00 - $2.50 •2')

      const result3 = getSmartDisplayPrice(priceData, { varianceThreshold: 200, priceThreshold: 2 })
      expect(result3).toBe('$1.00 •2')
    })

    it('should handle mobile abbreviation', () => {
      const priceData = [
        { subTypeName: 'Normal', marketPrice: 0.15 },
        { subTypeName: 'Master Ball', marketPrice: 20.42 }
      ]
      const result = getSmartDisplayPrice(priceData, { abbreviateMobile: true })
      expect(result).toBe('$0.15 - $20.42(2x)')
    })

    it('should return null for invalid data', () => {
      expect(getSmartDisplayPrice(null)).toBeNull()
      expect(getSmartDisplayPrice([])).toBeNull()
    })
  })
})