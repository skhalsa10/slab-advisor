/**
 * Image Compression Utility
 *
 * Compresses images client-side before uploading to avoid
 * Vercel's 4.5MB serverless function body size limit.
 *
 * @module image-compression
 */

export interface CompressionOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number
  /** Maximum height in pixels (default: 1920) */
  maxHeight?: number
  /** JPEG quality 0-1 (default: 0.85) */
  quality?: number
  /** Output format (default: 'image/jpeg') */
  format?: 'image/jpeg' | 'image/webp'
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'image/jpeg',
}

/**
 * Compress an image file to reduce size for upload
 *
 * Uses canvas to resize and re-encode the image.
 * Maintains aspect ratio while fitting within max dimensions.
 *
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns Promise resolving to compressed base64 string
 *
 * @example
 * ```typescript
 * const file = event.target.files[0]
 * const compressed = await compressImage(file)
 * // compressed is now a base64 string under ~2MB
 * ```
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img

        if (width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width
          width = opts.maxWidth
        }

        if (height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height
          height = opts.maxHeight
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64
        const base64 = canvas.toDataURL(opts.format, opts.quality)
        resolve(base64)
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Compress an existing base64 image string
 *
 * Useful for re-compressing images that are already in base64 format.
 *
 * @param base64 - Base64 image string (with or without data URI prefix)
 * @param options - Compression options
 * @returns Promise resolving to compressed base64 string
 */
export async function compressBase64Image(
  base64: string,
  options: CompressionOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img

        if (width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width
          width = opts.maxWidth
        }

        if (height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height
          height = opts.maxHeight
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64
        const compressedBase64 = canvas.toDataURL(opts.format, opts.quality)
        resolve(compressedBase64)
      } catch (err) {
        reject(err)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'))
    }

    img.src = base64
  })
}

/**
 * Estimate the size of a base64 string in bytes
 *
 * @param base64 - Base64 string to measure
 * @returns Estimated size in bytes
 */
export function estimateBase64Size(base64: string): number {
  // Remove data URI prefix if present
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64

  // Base64 encodes 3 bytes into 4 characters
  // Account for padding
  const padding = (base64Data.match(/=/g) || []).length
  return Math.floor((base64Data.length * 3) / 4) - padding
}

/**
 * Check if image needs compression based on estimated size
 *
 * @param base64 - Base64 string to check
 * @param maxSizeBytes - Maximum allowed size (default: 3MB to stay under 4.5MB limit)
 * @returns True if compression is recommended
 */
export function needsCompression(
  base64: string,
  maxSizeBytes: number = 3 * 1024 * 1024
): boolean {
  return estimateBase64Size(base64) > maxSizeBytes
}
