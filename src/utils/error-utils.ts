/**
 * Error Message Utilities
 * 
 * Centralized location for all error handling logic including contexts, messages,
 * and utility functions for converting error codes to user-friendly messages.
 */

// Error context types for error message utilities
export const ERROR_CONTEXT = {
  AUTH: 'auth',
  CARDS: 'cards',
  NETWORK: 'network',
  VALIDATION: 'validation',
  GENERAL: 'general',
} as const

export type ErrorContext = typeof ERROR_CONTEXT[keyof typeof ERROR_CONTEXT]

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

/**
 * Get user-friendly error message from error code or type
 * 
 * @param errorCode - The error code/type to convert
 * @param context - Optional context to provide more specific messages
 * @returns User-friendly error message
 */
export function getErrorMessage(errorCode: string, context?: ErrorContext): string {
  // Authentication errors
  if (context === ERROR_CONTEXT.AUTH || errorCode.startsWith('auth_')) {
    switch (errorCode) {
      case 'auth_error':
        return 'Authentication failed. Please try signing in again.'
      case 'no_session':
        return 'Authentication completed but no session was created. Please try again.'
      case 'callback_error':
        return 'An unexpected error occurred during authentication. Please try again.'
      default:
        return 'An authentication error occurred. Please try again.'
    }
  }

  // Card analysis errors
  if (context === ERROR_CONTEXT.CARDS || errorCode.startsWith('card_')) {
    switch (errorCode) {
      case 'card_analysis_failed':
        return 'Unable to analyze the card. Please try again or add it manually.'
      case 'card_upload_failed':
        return 'Failed to upload card image. Please check the file and try again.'
      case 'insufficient_credits':
        return 'Not enough credits to analyze this card. Please purchase more credits.'
      default:
        return 'An error occurred while processing the card. Please try again.'
    }
  }

  // Generic/unknown errors
  switch (errorCode) {
    case 'network_error':
      return 'Network error. Please check your connection and try again.'
    case 'server_error':
      return 'Server error. Please try again later.'
    case 'validation_error':
      return 'Invalid data provided. Please check your input and try again.'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}