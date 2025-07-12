import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/supabase-server')

const mockGetServerSession = vi.fn()
const mockSupabase = {
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
    }))
  }))
}

// Import mocked modules
vi.mocked(await import('@/lib/supabase-server')).getServerSession = mockGetServerSession

const mockUser = { id: 'user-123', email: 'test@example.com' }

describe('/api/update-card-details', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockGetServerSession.mockResolvedValue({
      user: mockUser,
      error: null,
      supabase: mockSupabase
    })
  })

  it('should successfully update card details', async () => {
    // Mock card ownership verification
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'card-123', user_id: 'user-123' },
      error: null
    })

    // Mock successful update
    const mockEq = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: mockEq
      }))
    })

    const cardDetails = {
      full_name: 'Updated Card Name',
      card_set: 'Updated Set',
      rarity: 'Rare',
      year: '2024'
    }

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cardId).toBe('card-123')
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue({
      user: null,
      error: 'Not authenticated',
      supabase: null
    })

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return 400 when cardId is missing', async () => {
    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardDetails: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid card ID is required')
  })

  it('should return 400 when cardId is invalid type', async () => {
    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 123, // Should be string
        cardDetails: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid card ID is required')
  })

  it('should return 404 when card is not found', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Not found')
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      }))
    })

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'nonexistent-card',
        cardDetails: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Card not found')
  })

  it('should return 404 when user does not own the card', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null, // No data returned due to user_id mismatch
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      }))
    })

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Card not found')
  })

  it('should handle database update errors', async () => {
    // Mock successful card verification
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'card-123', user_id: 'user-123' },
      error: null
    })

    // Mock failed update
    const mockEq = vi.fn().mockResolvedValue({ 
      error: new Error('Update failed') 
    })

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: mockEq
      }))
    })

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails: { full_name: 'Test' }
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update card details')
  })

  it('should update only provided fields', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'card-123', user_id: 'user-123' },
      error: null
    })

    const mockUpdate = vi.fn()
    const mockEq = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      })),
      update: mockUpdate.mockReturnValue({
        eq: mockEq
      })
    })

    const cardDetails = {
      full_name: 'New Name',
      year: '2024'
      // Other fields not provided
    }

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails
      })
    })

    await POST(request)

    expect(mockUpdate).toHaveBeenCalledWith({
      updated_at: expect.any(String),
      card_title: 'New Name',
      year: '2024'
    })
  })

  it('should handle all card detail fields', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'card-123', user_id: 'user-123' },
      error: null
    })

    const mockUpdate = vi.fn()
    const mockEq = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      })),
      update: mockUpdate.mockReturnValue({
        eq: mockEq
      })
    })

    const cardDetails = {
      full_name: 'Complete Card Name',
      card_set: 'Complete Set',
      rarity: 'Ultra Rare',
      out_of: '1000',
      card_number: '001',
      set_series_code: 'CSC',
      set_code: 'CS001',
      series: 'Complete Series',
      year: '2024',
      subcategory: 'Pokemon',
      links: { 'tcgplayer.com': 'https://tcgplayer.com' }
    }

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails
      })
    })

    await POST(request)

    expect(mockUpdate).toHaveBeenCalledWith({
      updated_at: expect.any(String),
      card_title: 'Complete Card Name',
      card_set: 'Complete Set',
      rarity: 'Ultra Rare',
      out_of: '1000',
      card_number: '001',
      set_series_code: 'CSC',
      set_code: 'CS001',
      series: 'Complete Series',
      year: '2024',
      subcategory: 'Pokemon',
      links: { 'tcgplayer.com': 'https://tcgplayer.com' }
    })
  })

  it('should handle unexpected errors with 500 status', async () => {
    const mockSingle = vi.fn().mockRejectedValue(new Error('Database connection error'))

    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: mockSingle
          }))
        }))
      }))
    })

    const request = new NextRequest('http://localhost/api/update-card-details', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-123',
        cardDetails: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database connection error')
    expect(data.success).toBe(false)
  })
})