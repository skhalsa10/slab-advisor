/**
 * Application-wide constants
 */

// Credit costs for different operations
export const CREDIT_COSTS = {
  CARD_ANALYSIS: 1,
  BULK_ANALYSIS: 5,
} as const

// API URLs
export const XIMILAR_API = {
  GRADE_URL: 'https://api.ximilar.com/card-grader/v2/grade',
  ANALYZE_URL: 'https://api.ximilar.com/collectibles/v2/analyze',
  IDENTIFY_URL: 'https://api.ximilar.com/collectibles/v2/tcg_id',
} as const

// File upload limits
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
} as const

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const

