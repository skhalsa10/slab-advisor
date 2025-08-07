import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkUserCredits, deductUserCredits } from './credits'

const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn()
    }))
  })),
  rpc: vi.fn()
})

describe('credits utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkUserCredits', () => {
    it('should return true when user has sufficient credits', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { credits_remaining: 10 },
        error: null
      })

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123', 5)

      expect(result.hasCredits).toBe(true)
      expect(result.creditsRemaining).toBe(10)
      expect(result.error).toBeUndefined()
      expect(mockSupabase.from).toHaveBeenCalledWith('user_credits')
    })

    it('should return false when user has insufficient credits', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { credits_remaining: 3 },
        error: null
      })

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123', 5)

      expect(result.hasCredits).toBe(false)
      expect(result.creditsRemaining).toBe(3)
      expect(result.error).toBe('Insufficient credits')
    })

    it('should use default of 1 credit when not specified', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { credits_remaining: 5 },
        error: null
      })

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123')

      expect(result.hasCredits).toBe(true)
      expect(result.creditsRemaining).toBe(5)
    })

    it('should handle database errors gracefully', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123', 1)

      expect(result.hasCredits).toBe(false)
      expect(result.creditsRemaining).toBe(0)
      expect(result.error).toBe('Failed to check credits')
    })

    it('should handle missing credit data', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123', 1)

      expect(result.hasCredits).toBe(false)
      expect(result.creditsRemaining).toBe(0)
      expect(result.error).toBe('No credit data found')
    })

    it('should handle exact credit amount correctly', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { credits_remaining: 5 },
        error: null
      })

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123', 5)

      expect(result.hasCredits).toBe(true)
      expect(result.creditsRemaining).toBe(5)
      expect(result.error).toBeUndefined()
    })

    it('should handle exceptions thrown during execution', async () => {
      const mockSupabase = createMockSupabase()
      const mockSingle = vi.fn().mockRejectedValue(new Error('Network error'))

            mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      } as any)

            const result = await checkUserCredits(mockSupabase as any, 'user-123', 1)

      expect(result.hasCredits).toBe(false)
      expect(result.creditsRemaining).toBe(0)
      expect(result.error).toBe('Failed to check credits')
    })
  })

  describe('deductUserCredits', () => {
    it('should successfully deduct credits', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.rpc.mockResolvedValue({ error: null })

            const result = await deductUserCredits(mockSupabase as any, 'user-123')

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockSupabase.rpc).toHaveBeenCalledWith('deduct_user_credit', {
        user_id: 'user-123'
      })
    })

    it('should handle database RPC errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.rpc.mockResolvedValue({ 
        error: new Error('RPC failed') 
      })

            const result = await deductUserCredits(mockSupabase as any, 'user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to deduct credits')
    })

    it('should handle exceptions during execution', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'))

            const result = await deductUserCredits(mockSupabase as any, 'user-123')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to deduct credits')
    })
  })
})