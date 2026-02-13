import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/middleware/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}))

vi.mock('@sentry/nextjs', () => ({
  startSpan: vi.fn((_, callback) => callback({ setAttribute: vi.fn() })),
  captureException: vi.fn(),
  metrics: {
    count: vi.fn(),
  },
}))

// Define mock functions that can be controlled in tests
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockStorageFrom = vi.fn()

vi.mock('@/lib/supabase-server', () => ({
  getAuthenticatedSupabaseClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
  getServerSupabaseClient: vi.fn(() => ({
    from: (table: string) => mockFrom(table),
    storage: {
      from: (bucket: string) => mockStorageFrom(bucket),
    },
  })),
}))

describe('DELETE /api/profile/delete-data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if confirmation is missing', async () => {
    const request = new NextRequest('http://localhost/api/profile/delete-data', {
      method: 'DELETE',
      body: JSON.stringify({}),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid confirmation')
  })

  it('should return 400 if confirmation is incorrect', async () => {
    const request = new NextRequest('http://localhost/api/profile/delete-data', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'wrong' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid confirmation')
  })

  it('should return 401 if user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const request = new NextRequest('http://localhost/api/profile/delete-data', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE ALL MY DATA' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should successfully delete all user data', async () => {
    const mockUserId = 'test-user-id'

    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    // Mock delete operations for admin client
    const mockDeleteChain = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
    }

    const mockUpdateChain = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return mockUpdateChain
      }
      return mockDeleteChain
    })

    // Mock storage.from().list() and .remove() for recursive file deletion
    mockStorageFrom.mockReturnValue({
      list: vi.fn().mockResolvedValue({ data: [], error: null }),
      remove: vi.fn().mockResolvedValue({ error: null }),
    })

    const request = new NextRequest('http://localhost/api/profile/delete-data', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE ALL MY DATA' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('All user data has been deleted')
    expect(data.counts).toBeDefined()
  })

  it('should handle database errors gracefully', async () => {
    const mockUserId = 'test-user-id'

    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    // Mock delete to fail
    mockFrom.mockReturnValue({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const request = new NextRequest('http://localhost/api/profile/delete-data', {
      method: 'DELETE',
      body: JSON.stringify({ confirmation: 'DELETE ALL MY DATA' }),
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to delete')
  })
})
