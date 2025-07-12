import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../analyze-card/route'
import { NextRequest } from 'next/server'

// Mock all dependencies
vi.mock('@/lib/supabase-server')
vi.mock('@/utils/credits')
vi.mock('@/utils/cardAnalysis')

const mockGetServerSession = vi.fn()
const mockCheckUserCredits = vi.fn()
const mockDeductUserCredits = vi.fn()
const mockValidateCardAccess = vi.fn()
const mockValidateImageAccess = vi.fn()
const mockCallXimilarAPIs = vi.fn()
const mockProcessXimilarResponses = vi.fn()
const mockValidateGradingResults = vi.fn()
const mockExtractCardIdentification = vi.fn()
const mockCalculateFinalGrade = vi.fn()
const mockDownloadOverlayImages = vi.fn()
const mockUpdateCardWithResults = vi.fn()

// Import mocked modules
vi.mocked(await import('@/lib/supabase-server')).getServerSession = mockGetServerSession
vi.mocked(await import('@/utils/credits')).checkUserCredits = mockCheckUserCredits
vi.mocked(await import('@/utils/credits')).deductUserCredits = mockDeductUserCredits
vi.mocked(await import('@/utils/cardAnalysis')).validateCardAccess = mockValidateCardAccess
vi.mocked(await import('@/utils/cardAnalysis')).validateImageAccess = mockValidateImageAccess
vi.mocked(await import('@/utils/cardAnalysis')).callXimilarAPIs = mockCallXimilarAPIs
vi.mocked(await import('@/utils/cardAnalysis')).processXimilarResponses = mockProcessXimilarResponses
vi.mocked(await import('@/utils/cardAnalysis')).validateGradingResults = mockValidateGradingResults
vi.mocked(await import('@/utils/cardAnalysis')).extractCardIdentification = mockExtractCardIdentification
vi.mocked(await import('@/utils/cardAnalysis')).calculateFinalGrade = mockCalculateFinalGrade
vi.mocked(await import('@/utils/cardAnalysis')).downloadOverlayImages = mockDownloadOverlayImages
vi.mocked(await import('@/utils/cardAnalysis')).updateCardWithResults = mockUpdateCardWithResults

const mockCard = {
  id: 'card-123',
  user_id: 'user-123',
  front_image_url: 'https://example.com/front.jpg',
  back_image_url: 'https://example.com/back.jpg',
  card_title: 'Test Card'
}

const mockUser = { id: 'user-123', email: 'test@example.com' }
const mockSupabase = { from: vi.fn() }

describe('/api/analyze-card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful mocks
    mockGetServerSession.mockResolvedValue({
      user: mockUser,
      error: null,
      supabase: mockSupabase
    })
    
    mockCheckUserCredits.mockResolvedValue({
      hasCredits: true,
      creditsRemaining: 10
    })
    
    mockValidateCardAccess.mockResolvedValue({
      success: true,
      card: mockCard
    })
    
    mockValidateImageAccess.mockResolvedValue(true)
    
    mockCallXimilarAPIs.mockResolvedValue({
      gradeResponse: { status: 200 },
      analyzeResponse: { status: 200 }
    })
    
    mockProcessXimilarResponses.mockResolvedValue({
      gradeResult: { records: [{ grades: { final: 9 } }] },
      analyzeResult: { records: [] }
    })
    
    mockValidateGradingResults.mockReturnValue(undefined)
    
    mockExtractCardIdentification.mockReturnValue({
      full_name: 'Test Card',
      set: 'Test Set'
    })
    
    mockCalculateFinalGrade.mockReturnValue({
      estimatedGrade: 9,
      confidence: 0.95,
      gradingDetails: { test: 'data' }
    })
    
    mockDownloadOverlayImages.mockResolvedValue({
      front_full_overlay_url: 'https://example.com/overlay.jpg',
      front_exact_overlay_url: null,
      back_full_overlay_url: null,
      back_exact_overlay_url: null
    })
    
    mockUpdateCardWithResults.mockResolvedValue(undefined)
    
    mockDeductUserCredits.mockResolvedValue({
      success: true
    })
  })

  it('should successfully analyze a card', async () => {
    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cardId).toBe('card-123')
    expect(data.estimatedGrade).toBe(9)
    expect(data.confidence).toBe(0.95)
    expect(data.analyzeSuccess).toBe(true)
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetServerSession.mockResolvedValue({
      user: null,
      error: 'Not authenticated',
      supabase: null
    })

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('should return 400 when cardId is missing', async () => {
    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Valid card ID is required')
  })

  it('should return 402 when user has no credits', async () => {
    mockCheckUserCredits.mockResolvedValue({
      hasCredits: false,
      creditsRemaining: 0
    })

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(402)
    expect(data.error).toBe('No credits remaining. Please purchase more credits to analyze cards.')
    expect(data.success).toBe(false)
  })

  it('should return 400 when card validation fails', async () => {
    mockValidateCardAccess.mockResolvedValue({
      success: false,
      error: 'Card not found'
    })

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Card not found')
  })

  it('should return 400 when images are not accessible', async () => {
    mockValidateImageAccess.mockResolvedValue(false)

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Card images are not publicly accessible. Please try uploading again.')
    expect(data.success).toBe(false)
  })

  it('should handle grading validation errors', async () => {
    mockValidateGradingResults.mockImplementation(() => {
      throw new Error('Grading failed')
    })

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Grading failed')
    expect(data.success).toBe(false)
  })

  it('should continue analysis even if credit deduction fails', async () => {
    mockDeductUserCredits.mockResolvedValue({
      success: false,
      error: 'Deduction failed'
    })

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Analysis should complete successfully despite credit deduction failure
  })

  it('should handle analyze failure gracefully', async () => {
    mockExtractCardIdentification.mockReturnValue(null)
    mockProcessXimilarResponses.mockResolvedValue({
      gradeResult: { records: [{ grades: { final: 9 } }] },
      analyzeResult: { records: [] }
    })

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.analyzeSuccess).toBe(false)
    expect(data.analyzeMessage).toBe('Unable to identify card. Please enter details manually.')
  })

  it('should handle unexpected errors with 500 status', async () => {
    mockCallXimilarAPIs.mockRejectedValue(new Error('Network error'))

    const request = new NextRequest('http://localhost/api/analyze-card', {
      method: 'POST',
      body: JSON.stringify({ cardId: 'card-123' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Network error')
    expect(data.success).toBe(false)
  })
})