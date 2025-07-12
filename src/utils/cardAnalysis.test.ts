import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateCardAccess,
  validateImageAccess,
  processXimilarResponses,
  validateGradingResults,
  extractCardIdentification,
  calculateFinalGrade,
  updateCardWithResults
} from './cardAnalysis'
import { XimilarApiResponse, Match } from '@/types/ximilar'
import { Card } from '@/types/database'

// Mock the global fetch function
global.fetch = vi.fn()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    }
  }))
})

const mockCard: Card = {
  id: 'card-123',
  user_id: 'user-123',
  front_image_url: 'https://example.com/front.jpg',
  back_image_url: 'https://example.com/back.jpg',
  card_title: 'Test Card',
  estimated_grade: null,
  confidence: null,
  grading_details: null,
  front_full_overlay_url: null,
  front_exact_overlay_url: null,
  back_full_overlay_url: null,
  back_exact_overlay_url: null,
  ungraded_price: null,
  graded_prices: null,
  price_date: null,
  card_set: null,
  rarity: null,
  out_of: null,
  card_number: null,
  set_series_code: null,
  set_code: null,
  series: null,
  year: null,
  subcategory: null,
  links: null,
  analyze_details: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('cardAnalysis utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateCardAccess', () => {
    it('should return success when card exists and has images', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: mockCard,
        error: null
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockSingle
            }))
          }))
        }))
      } as any)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await validateCardAccess(mockSupabase as any, 'user-123', 'card-123')

      expect(result.success).toBe(true)
      expect(result.card).toEqual(mockCard)
      expect(result.error).toBeUndefined()
    })

    it('should return error when card not found', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockSingle
            }))
          }))
        }))
      } as any)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await validateCardAccess(mockSupabase as any, 'user-123', 'card-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card not found')
    })

    it('should return error when card missing images', async () => {
      const mockSupabase = createMockSupabase()
      const cardWithoutImages = { ...mockCard, front_image_url: null }
      const mockSingle = vi.fn().mockResolvedValue({
        data: cardWithoutImages,
        error: null
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockSingle
            }))
          }))
        }))
      } as any)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await validateCardAccess(mockSupabase as any, 'user-123', 'card-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Card images not found')
    })
  })

  describe('validateImageAccess', () => {
    it('should return true when both images are accessible', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true
      } as Response)

      const result = await validateImageAccess(mockCard)

      expect(result).toBe(true)
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenCalledWith('https://example.com/front.jpg', { method: 'HEAD' })
      expect(fetch).toHaveBeenCalledWith('https://example.com/back.jpg', { method: 'HEAD' })
    })

    it('should return false when images are not accessible', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false
      } as Response)

      const result = await validateImageAccess(mockCard)

      expect(result).toBe(false)
    })

    it('should return false when fetch throws error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await validateImageAccess(mockCard)

      expect(result).toBe(false)
    })
  })

  describe('processXimilarResponses', () => {
    it('should parse valid JSON responses', async () => {
      const gradeResponse = {
        text: vi.fn().mockResolvedValue('{"records": [{"grades": {"final": 9}}], "status": "success", "statistics": {}}')
      } as any

      const analyzeResponse = {
        text: vi.fn().mockResolvedValue('{"records": [{"_objects": []}], "status": "success", "statistics": {}}')
      } as any

      const result = await processXimilarResponses(gradeResponse, analyzeResponse)

      expect(result.gradeResult.records).toEqual([{ grades: { final: 9 } }])
      expect(result.analyzeResult?.records).toEqual([{ _objects: [] }])
    })

    it('should handle invalid JSON in grade response', async () => {
      const gradeResponse = {
        text: vi.fn().mockResolvedValue('invalid json')
      } as any

      const analyzeResponse = {
        text: vi.fn().mockResolvedValue('{"records": [], "status": "success", "statistics": {}}')
      } as any

      await expect(processXimilarResponses(gradeResponse, analyzeResponse))
        .rejects.toThrow('Unable to analyze card. Please ensure images are clear and well-lit.')
    })

    it('should handle invalid JSON in analyze response gracefully', async () => {
      const gradeResponse = {
        text: vi.fn().mockResolvedValue('{"records": [], "status": "success", "statistics": {}}')
      } as any

      const analyzeResponse = {
        text: vi.fn().mockResolvedValue('invalid json')
      } as any

      const result = await processXimilarResponses(gradeResponse, analyzeResponse)

      expect(result.gradeResult.records).toEqual([])
      expect(result.analyzeResult).toBeNull()
    })
  })

  describe('validateGradingResults', () => {
    it('should pass validation for valid grading results', () => {
      const validResult: Partial<XimilarApiResponse> = {
        records: [
          {
            grades: { final: 9 } as any,
            side: 'front'
          } as any
        ]
      }

      expect(() => validateGradingResults(validResult as XimilarApiResponse)).not.toThrow()
    })

    it('should throw error for empty records', () => {
      const invalidResult: Partial<XimilarApiResponse> = {
        records: []
      }

      expect(() => validateGradingResults(invalidResult as XimilarApiResponse))
        .toThrow('Unable to analyze card. Please ensure images are clear and well-lit.')
    })

    it('should throw error for missing grades', () => {
      const invalidResult: Partial<XimilarApiResponse> = {
        records: [
          {
            side: 'front'
          } as any
        ]
      }

      expect(() => validateGradingResults(invalidResult as XimilarApiResponse))
        .toThrow('Unable to grade card. Please check image quality.')
    })
  })

  describe('extractCardIdentification', () => {
    it('should extract card identification from valid response', () => {
      const mockMatch: Match = {
        full_name: 'Test Card',
        set: 'Test Set',
        rarity: 'Rare',
        out_of: '100',
        card_number: '1',
        set_series_code: 'TST',
        set_code: 'TST001',
        series: 'Test Series',
        year: '2024',
        subcategory: 'Pokemon',
        links: { 'tcgplayer.com': 'https://tcgplayer.com/test' }
      }

      const analyzeResult: Partial<XimilarApiResponse> = {
        records: [
          {
            _objects: [
              {
                name: 'Card',
                _identification: {
                  best_match: mockMatch
                }
              } as any
            ]
          } as any
        ]
      }

      const result = extractCardIdentification(analyzeResult as XimilarApiResponse)

      expect(result).toEqual(mockMatch)
    })

    it('should return null for invalid response', () => {
      const result = extractCardIdentification(null)
      expect(result).toBeNull()
    })

    it('should return null when no card object found', () => {
      const analyzeResult: Partial<XimilarApiResponse> = {
        records: [
          {
            _objects: [
              {
                name: 'Other',
                _identification: {
                  best_match: {} as Match
                }
              } as any
            ]
          } as any
        ]
      }

      const result = extractCardIdentification(analyzeResult as XimilarApiResponse)
      expect(result).toBeNull()
    })
  })

  describe('calculateFinalGrade', () => {
    it('should calculate grade from front result', () => {
      const gradeResult: Partial<XimilarApiResponse> = {
        records: [
          {
            side: 'front',
            grades: { final: 9.5 } as any
          } as any,
          {
            side: 'back',
            grades: { final: 8.5 } as any
          } as any
        ]
      }

      const result = calculateFinalGrade(gradeResult as XimilarApiResponse)

      expect(result.estimatedGrade).toBe(9.5)
      expect(result.confidence).toBe(0.95)
      expect(result.gradingDetails).toHaveProperty('ximilar_response')
      expect(result.gradingDetails).toHaveProperty('weighted_calculation')
      expect(result.gradingDetails).toHaveProperty('metadata')
    })

    it('should handle missing front result by using back result', () => {
      const gradeResult: Partial<XimilarApiResponse> = {
        records: [
          {
            side: 'back',
            grades: { final: 8.5 } as any
          } as any
        ]
      }

      const result = calculateFinalGrade(gradeResult as XimilarApiResponse)

      expect(result.estimatedGrade).toBe(8.5)
      expect(result.confidence).toBe(0.95)
    })

    it('should throw error for card detection failure', () => {
      const gradeResult: Partial<XimilarApiResponse> = {
        records: [
          {
            side: 'front',
            _status: { code: 400 } as any,
            grades: { final: 9.5 } as any
          } as any
        ]
      }

      expect(() => calculateFinalGrade(gradeResult as XimilarApiResponse))
        .toThrow('Could not detect a trading card in the image. Please ensure:')
    })

    it('should handle no valid grades', () => {
      const gradeResult: Partial<XimilarApiResponse> = {
        records: [
          {
            side: 'front'
          } as any
        ]
      }

      const result = calculateFinalGrade(gradeResult as XimilarApiResponse)

      expect(result.estimatedGrade).toBeNull()
      expect(result.confidence).toBeNull()
    })
  })

  describe('updateCardWithResults', () => {
    it('should update card with complete analysis data', async () => {
      const mockSupabase = createMockSupabase()
      const mockEq = vi.fn().mockResolvedValue({ error: null })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: mockEq
        }))
      } as any)

      const analysisData = {
        estimatedGrade: 9.5,
        confidence: 0.95,
        gradingDetails: { test: 'data' },
        cardIdentification: {
          full_name: 'Test Card',
          set: 'Test Set'
        } as Match,
        overlayUrls: {
          front_full_overlay_url: 'https://example.com/front-full.jpg',
          front_exact_overlay_url: null,
          back_full_overlay_url: null,
          back_exact_overlay_url: null
        },
        analyzeDetails: { records: [] } as any
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateCardWithResults(mockSupabase as any, 'card-123', analysisData)

      expect(mockSupabase.from).toHaveBeenCalledWith('cards')
    })

    it('should handle update errors', async () => {
      const mockSupabase = createMockSupabase()
      const mockEq = vi.fn().mockResolvedValue({ error: new Error('Update failed') })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: mockEq
        }))
      } as any)

      const analysisData = {
        estimatedGrade: 9.5,
        confidence: 0.95,
        gradingDetails: {},
        cardIdentification: null,
        overlayUrls: {},
        analyzeDetails: null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(updateCardWithResults(mockSupabase as any, 'card-123', analysisData))
        .rejects.toThrow('Failed to save analysis results')
    })
  })
})