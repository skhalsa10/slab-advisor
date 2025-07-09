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

// Error messages
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  NO_CREDITS: 'No credits remaining. Please purchase more credits to analyze cards.',
  INVALID_CARD_ID: 'Valid card ID is required',
  CARD_NOT_FOUND: 'Card not found',
  CARD_IMAGES_NOT_FOUND: 'Card images not found',
  IMAGES_NOT_ACCESSIBLE: 'Card images are not publicly accessible. Please try uploading again.',
  ANALYSIS_FAILED: 'Unable to analyze card. Please ensure images are clear and well-lit.',
  GRADING_FAILED: 'Unable to grade card. Please check image quality.',
  CARD_DETECTION_FAILED: 'Could not detect a trading card in the image. Please ensure:\n" The card is clearly visible and fills most of the frame\n" Good lighting without glare or shadows\n" Card is flat and not at an extreme angle\n" Background contrasts with the card',
} as const