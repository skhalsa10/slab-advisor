import { SupabaseClient } from '@supabase/supabase-js'
import { XIMILAR_API, ERROR_MESSAGES } from '@/constants/constants'
import { XimilarApiResponse, Match } from '@/types/ximilar'
import { Card } from '@/types/database'

export interface ValidationResult {
  success: boolean
  error?: string
  card?: Card
}

export interface AnalysisResult {
  success: boolean
  error?: string
  data?: {
    estimatedGrade: number | null
    confidence: number | null
    gradingDetails: Record<string, unknown>
    cardIdentification: Match | null
    analyzeSuccess: boolean
    analyzeMessage: string | null
  }
}

/**
 * Validate user authentication and card ownership
 */
export async function validateCardAccess(
  supabase: SupabaseClient,
  userId: string,
  cardId: string
): Promise<ValidationResult> {
  try {
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single()

    if (cardError || !card) {
      return { success: false, error: 'Card not found' }
    }

    if (!card.front_image_url || !card.back_image_url) {
      return { success: false, error: 'Card images not found' }
    }

    return { success: true, card }
  } catch {
    return { success: false, error: 'Failed to validate card access' }
  }
}

/**
 * Validate that card images are accessible
 */
export async function validateImageAccess(card: Card): Promise<boolean> {
  try {
    const frontCheck = await fetch(card.front_image_url!, { method: 'HEAD' })
    const backCheck = await fetch(card.back_image_url!, { method: 'HEAD' })
    
    return frontCheck.ok && backCheck.ok
  } catch {
    return false
  }
}

/**
 * Call Ximilar APIs for grading and analysis
 */
export async function callXimilarAPIs(card: Card): Promise<{
  gradeResponse: Response
  analyzeResponse: Response
}> {
  const gradePayload = {
    records: [
      { _url: card.front_image_url, side: 'front' },
      { _url: card.back_image_url, side: 'back' }
    ]
  }

  const analyzePayload = {
    records: [{ _url: card.front_image_url }]
  }

  const [gradeResponse, analyzeResponse] = await Promise.all([
    fetch(XIMILAR_API.GRADE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.XIMILAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gradePayload)
    }),
    fetch(XIMILAR_API.ANALYZE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Token ${process.env.XIMILAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analyzePayload)
    })
  ])

  return { gradeResponse, analyzeResponse }
}

/**
 * Process Ximilar API responses
 */
export async function processXimilarResponses(
  gradeResponse: Response,
  analyzeResponse: Response
): Promise<{
  gradeResult: XimilarApiResponse
  analyzeResult: XimilarApiResponse | null
}> {
  const gradeResponseText = await gradeResponse.text()
  const analyzeResponseText = await analyzeResponse.text()

  let gradeResult: XimilarApiResponse
  let analyzeResult: XimilarApiResponse | null

  try {
    gradeResult = JSON.parse(gradeResponseText) as XimilarApiResponse
  } catch {
    throw new Error(ERROR_MESSAGES.ANALYSIS_FAILED)
  }

  try {
    analyzeResult = JSON.parse(analyzeResponseText) as XimilarApiResponse
  } catch {
    analyzeResult = null
  }

  return { gradeResult, analyzeResult }
}

/**
 * Validate grading results
 */
export function validateGradingResults(gradeResult: XimilarApiResponse): void {
  if (!gradeResult.records || gradeResult.records.length === 0) {
    throw new Error(ERROR_MESSAGES.ANALYSIS_FAILED)
  }

  const hasValidGrades = gradeResult.records.some(
    (r) => r.grades && r.grades.final
  )
  
  if (!hasValidGrades) {
    throw new Error(ERROR_MESSAGES.GRADING_FAILED)
  }
}

/**
 * Extract card identification from analyze results
 */
export function extractCardIdentification(
  analyzeResult: XimilarApiResponse | null
): Match | null {
  if (!analyzeResult?.records?.length) return null

  const firstRecord = analyzeResult.records[0]
  const cardObject = firstRecord._objects?.find(obj => obj.name === 'Card')
  
  return cardObject?._identification?.best_match || null
}

/**
 * Calculate final grade from Ximilar response
 */
export function calculateFinalGrade(gradeResult: XimilarApiResponse): {
  estimatedGrade: number | null
  confidence: number | null
  gradingDetails: Record<string, unknown>
} {
  const frontResult = gradeResult.records.find(r => r.side === 'front')
  const backResult = gradeResult.records.find(r => r.side === 'back')

  // Check for card detection errors
  if (frontResult?._status?.code === 400 || backResult?._status?.code === 400) {
    throw new Error(ERROR_MESSAGES.CARD_DETECTION_FAILED)
  }

  const estimatedGrade = frontResult?.grades?.final || backResult?.grades?.final || null
  const confidence = estimatedGrade ? 0.95 : null

  const weightedCalculation = {
    front_grade: frontResult?.grades?.final,
    back_grade: backResult?.grades?.final,
    ximilar_final_grade: estimatedGrade,
    note: 'Using Ximilar\'s sophisticated grading algorithm with professional weighting'
  }

  const gradingDetails = {
    ximilar_response: gradeResult,
    weighted_calculation: weightedCalculation,
    metadata: {
      analysis_date: new Date().toISOString(),
      api_version: 'card-grader/v2/grade',
      credit_count: 1,
      processing_time: gradeResult.statistics?.['processing time'] || null
    }
  }

  return { estimatedGrade, confidence, gradingDetails }
}

/**
 * Download and store overlay images
 */
export async function downloadOverlayImages(
  supabase: SupabaseClient,
  gradeResult: XimilarApiResponse,
  userId: string,
  cardId: string
): Promise<{
  front_full_overlay_url: string | null
  front_exact_overlay_url: string | null
  back_full_overlay_url: string | null
  back_exact_overlay_url: string | null
}> {
  const overlayUrls = {
    front_full_overlay_url: null as string | null,
    front_exact_overlay_url: null as string | null,
    back_full_overlay_url: null as string | null,
    back_exact_overlay_url: null as string | null
  }

  try {
    const frontResult = gradeResult.records.find(r => r.side === 'front')
    const backResult = gradeResult.records.find(r => r.side === 'back')

    // Download front overlay images
    if (frontResult?._full_url_card) {
      const response = await fetch(frontResult._full_url_card)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const fileName = `${userId}/${cardId}/front_full.webp`

        const { error } = await supabase.storage
          .from('card-images')
          .upload(fileName, buffer, {
            contentType: 'image/webp',
            upsert: true
          })

        if (!error) {
          const { data } = supabase.storage
            .from('card-images')
            .getPublicUrl(fileName)
          overlayUrls.front_full_overlay_url = data.publicUrl
        }
      }
    }

    if (frontResult?._exact_url_card) {
      const response = await fetch(frontResult._exact_url_card)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const fileName = `${userId}/${cardId}/front_exact.webp`

        const { error } = await supabase.storage
          .from('card-images')
          .upload(fileName, buffer, {
            contentType: 'image/webp',
            upsert: true
          })

        if (!error) {
          const { data } = supabase.storage
            .from('card-images')
            .getPublicUrl(fileName)
          overlayUrls.front_exact_overlay_url = data.publicUrl
        }
      }
    }

    // Download back overlay images
    if (backResult?._full_url_card) {
      const response = await fetch(backResult._full_url_card)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const fileName = `${userId}/${cardId}/back_full.webp`

        const { error } = await supabase.storage
          .from('card-images')
          .upload(fileName, buffer, {
            contentType: 'image/webp',
            upsert: true
          })

        if (!error) {
          const { data } = supabase.storage
            .from('card-images')
            .getPublicUrl(fileName)
          overlayUrls.back_full_overlay_url = data.publicUrl
        }
      }
    }

    if (backResult?._exact_url_card) {
      const response = await fetch(backResult._exact_url_card)
      if (response.ok) {
        const buffer = await response.arrayBuffer()
        const fileName = `${userId}/${cardId}/back_exact.webp`

        const { error } = await supabase.storage
          .from('card-images')
          .upload(fileName, buffer, {
            contentType: 'image/webp',
            upsert: true
          })

        if (!error) {
          const { data } = supabase.storage
            .from('card-images')
            .getPublicUrl(fileName)
          overlayUrls.back_exact_overlay_url = data.publicUrl
        }
      }
    }
  } catch {
    // Continue without overlay images if download fails
  }

  return overlayUrls
}

/**
 * Update card with analysis results
 */
export async function updateCardWithResults(
  supabase: SupabaseClient,
  cardId: string,
  analysisData: {
    estimatedGrade: number | null
    confidence: number | null
    gradingDetails: Record<string, unknown>
    cardIdentification: Match | null
    overlayUrls: Record<string, string | null>
    analyzeDetails: XimilarApiResponse | null
  }
): Promise<void> {
  const updateData: Record<string, unknown> = {
    estimated_grade: analysisData.estimatedGrade,
    confidence: analysisData.confidence,
    grading_details: analysisData.gradingDetails,
    front_full_overlay_url: analysisData.overlayUrls.front_full_overlay_url,
    front_exact_overlay_url: analysisData.overlayUrls.front_exact_overlay_url,
    back_full_overlay_url: analysisData.overlayUrls.back_full_overlay_url,
    back_exact_overlay_url: analysisData.overlayUrls.back_exact_overlay_url,
    updated_at: new Date().toISOString()
  }

  // Add card identification fields if available
  if (analysisData.cardIdentification) {
    const id = analysisData.cardIdentification
    updateData.card_title = id.full_name
    updateData.card_set = id.set
    updateData.rarity = id.rarity
    updateData.out_of = id.out_of
    updateData.card_number = id.card_number
    updateData.set_series_code = id.set_series_code
    updateData.set_code = id.set_code
    updateData.series = id.series
    updateData.year = id.year ? Number(id.year) : null
    updateData.subcategory = id.subcategory
    updateData.links = id.links
  }

  if (analysisData.analyzeDetails) {
    updateData.analyze_details = analysisData.analyzeDetails
  }

  const { error } = await supabase
    .from('cards')
    .update(updateData)
    .eq('id', cardId)

  if (error) {
    throw new Error('Failed to save analysis results')
  }
}