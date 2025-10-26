/**
 * Security: Input Sanitization Utilities
 *
 * Defense-in-depth: Even though database enforces format,
 * sanitization provides additional protection against XSS and injection attacks
 */

/**
 * Sanitizes username for safe display
 * Only allows alphanumeric and underscore characters
 *
 * @param username - Username to sanitize
 * @returns Sanitized username (safe for display)
 */
export function sanitizeUsername(username: string): string {
  // Only allow alphanumeric and underscore
  return username.replace(/[^a-zA-Z0-9_]/g, '')
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this for displaying user-generated text content
 *
 * @param text - Text to escape
 * @returns HTML-safe text
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return text.replace(/[&<>"'/]/g, char => htmlEscapeMap[char])
}

/**
 * Sanitizes text for safe display (removes all HTML tags)
 * Use this for bio, display_name, and other text fields
 *
 * @param text - Text to sanitize
 * @returns Text with HTML tags removed
 */
export function sanitizeText(text: string): string {
  // Remove all HTML tags
  return text.replace(/<[^>]*>/g, '')
}

/**
 * Validates and sanitizes URL input
 * Only allows http:// and https:// protocols
 *
 * @param url - URL to validate
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Limits string length safely (prevents buffer overflow attacks)
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Removes dangerous characters from file names
 *
 * @param filename - Original filename
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove directory traversal attempts
  const safeName = filename.replace(/\.\./g, '')

  // Only allow alphanumeric, dash, underscore, and single dot
  return safeName.replace(/[^a-zA-Z0-9._-]/g, '_')
}
