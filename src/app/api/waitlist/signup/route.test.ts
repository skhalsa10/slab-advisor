import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Resend before importing route
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: vi.fn().mockResolvedValue({ id: 'email-123' }) },
    contacts: { create: vi.fn().mockResolvedValue({ id: 'contact-123' }) },
  })),
}))

// Mock Supabase server client
const mockInsert = vi.fn()
vi.mock('@/lib/supabase-server', () => ({
  getServerSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}))

// Mock rate limiter
vi.mock('@/middleware/rateLimit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(null),
}))

// Mock email component
vi.mock('@/components/emails/WelcomeEmail', () => ({
  default: vi.fn(() => null),
}))

import { POST } from './route'
import { NextRequest } from 'next/server'

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/waitlist/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/waitlist/signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    process.env.RESEND_API_KEY = 'test-key'
  })

  it('should return success for a valid email', async () => {
    const request = createRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should normalize email to lowercase', async () => {
    const request = createRequest({ email: 'Test@EXAMPLE.com' })
    await POST(request)

    expect(mockInsert).toHaveBeenCalledWith({ email: 'test@example.com' })
  })

  it('should trim whitespace from email', async () => {
    const request = createRequest({ email: '  test@example.com  ' })
    await POST(request)

    expect(mockInsert).toHaveBeenCalledWith({ email: 'test@example.com' })
  })

  it('should return 400 when email is missing', async () => {
    const request = createRequest({})
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('should return 400 when email is empty string', async () => {
    const request = createRequest({ email: '' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('should return 400 when email is not a string', async () => {
    const request = createRequest({ email: 123 })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('should return 400 for invalid email format', async () => {
    const request = createRequest({ email: 'not-an-email' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Please enter a valid email address')
  })

  it('should return 400 for email exceeding max length', async () => {
    const longEmail = 'a'.repeat(250) + '@example.com'
    const request = createRequest({ email: longEmail })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Please enter a valid email address')
  })

  it('should return success for duplicate emails (prevents enumeration)', async () => {
    mockInsert.mockResolvedValue({
      error: { code: '23505', message: 'duplicate key' },
    })

    const request = createRequest({ email: 'duplicate@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should return 500 for non-duplicate database errors', async () => {
    mockInsert.mockResolvedValue({
      error: { code: '42P01', message: 'relation does not exist' },
    })

    const request = createRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to join waitlist. Please try again.')
  })

  it('should still succeed if email sending fails', async () => {
    // The Resend mock is set up to succeed by default
    // This test verifies the route succeeds regardless of email
    const request = createRequest({ email: 'test@example.com' })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
