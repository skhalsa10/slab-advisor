/**
 * Storage Service for Collection Card Images
 *
 * Handles all storage operations for card images including:
 * - Uploading user's original card images (front/back)
 * - Converting images to base64 for Ximilar API calls
 * - Downloading and storing Ximilar's annotated images
 * - Cleaning up images when cards are deleted
 *
 * All operations use the service role client for elevated permissions.
 *
 * @module storage-service
 */

import { getServerSupabaseClient } from './supabase-server'
import { STORAGE_BUCKETS, FILE_LIMITS } from '@/constants/constants'

/**
 * Storage path helper - generates consistent paths for card images
 */
function getImagePath(
  userId: string,
  collectionCardId: string,
  filename: string
): string {
  return `${userId}/${collectionCardId}/${filename}`
}

/**
 * Detects MIME type from base64 data URI or buffer
 */
function detectMimeType(data: string | Buffer): string {
  if (typeof data === 'string') {
    // Check for data URI prefix
    const match = data.match(/^data:([^;]+);base64,/)
    if (match) {
      return match[1]
    }
  }

  // Default to JPEG if we can't detect
  return 'image/jpeg'
}

/**
 * Extracts file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return mimeToExt[mimeType] || 'jpg'
}

/**
 * Uploads a card image to the private storage bucket
 *
 * @param userId - The user's ID (for path isolation)
 * @param collectionCardId - The collection card ID
 * @param side - 'front' or 'back'
 * @param imageData - Base64 encoded image data (with or without data URI prefix)
 * @returns The storage path of the uploaded image
 */
export async function uploadCardImage(
  userId: string,
  collectionCardId: string,
  side: 'front' | 'back',
  imageData: string
): Promise<{ path: string; error: string | null }> {
  const supabase = getServerSupabaseClient()

  // Detect MIME type and get extension
  const mimeType = detectMimeType(imageData)
  const extension = getExtensionFromMimeType(mimeType)

  // Validate MIME type
  if (!(FILE_LIMITS.ALLOWED_TYPES as readonly string[]).includes(mimeType)) {
    return {
      path: '',
      error: `Invalid file type: ${mimeType}. Allowed types: ${FILE_LIMITS.ALLOWED_TYPES.join(', ')}`,
    }
  }

  // Remove data URI prefix if present
  const base64Data = imageData.replace(/^data:[^;]+;base64,/, '')

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64')

  // Validate file size
  if (buffer.length > FILE_LIMITS.MAX_SIZE) {
    return {
      path: '',
      error: `File size exceeds ${FILE_LIMITS.MAX_SIZE / 1024 / 1024}MB limit`,
    }
  }

  const filename = `${side}_original.${extension}`
  const path = getImagePath(userId, collectionCardId, filename)

  // If uploading front image, clear the entire folder first (fresh grading session)
  // Back image upload happens after front, so folder will already be cleared
  // Supabase remove() is idempotent - it won't error if files don't exist
  if (side === 'front') {
    await deleteCardImages(userId, collectionCardId)
  }

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.COLLECTION_CARD_IMAGES)
    .upload(path, buffer, {
      contentType: mimeType,
    })

  if (error) {
    return { path: '', error: error.message }
  }

  return { path, error: null }
}

/**
 * Downloads an image from storage and converts it to base64
 * Used to prepare images for Ximilar API calls (keeps images private)
 *
 * @param storagePath - The path within the storage bucket
 * @returns Base64 encoded image with data URI prefix
 */
export async function getImageAsBase64(
  storagePath: string
): Promise<{ base64: string; error: string | null }> {
  const supabase = getServerSupabaseClient()

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.COLLECTION_CARD_IMAGES)
    .download(storagePath)

  if (error) {
    return { base64: '', error: error.message }
  }

  // Convert blob to base64
  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')

  // Detect MIME type from the blob
  const mimeType = data.type || 'image/jpeg'

  return {
    base64: `data:${mimeType};base64,${base64}`,
    error: null,
  }
}

/**
 * Downloads an external image (e.g., from Ximilar) and stores it in our bucket
 * Used to persist Ximilar's annotated images which are temporary
 *
 * @param userId - The user's ID
 * @param collectionCardId - The collection card ID
 * @param sourceUrl - The external URL to download from
 * @param filename - The filename to save as (e.g., 'front_graded_full.webp')
 * @returns The storage path of the saved image
 */
export async function downloadAndStoreImage(
  userId: string,
  collectionCardId: string,
  sourceUrl: string,
  filename: string
): Promise<{ path: string; error: string | null }> {
  const supabase = getServerSupabaseClient()

  try {
    // SSRF Protection: Only allow downloads from trusted Ximilar domains
    // Ximilar hosts temporary annotated images on AWS S3 (ximilar-tmp-images bucket)
    const url = new URL(sourceUrl)
    const allowedDomains = ['.ximilar.com', 'ximilar.com']
    const allowedS3Buckets = ['ximilar-tmp-images']

    const isAllowedXimilarDomain = allowedDomains.some(
      (domain) => url.hostname === domain || url.hostname.endsWith(domain)
    )

    // Check for Ximilar's S3 bucket (format: s3-region.amazonaws.com/ximilar-tmp-images/...)
    const isAllowedS3Bucket =
      url.hostname.endsWith('.amazonaws.com') &&
      allowedS3Buckets.some((bucket) => url.pathname.startsWith(`/${bucket}/`))

    if (!isAllowedXimilarDomain && !isAllowedS3Bucket) {
      return { path: '', error: 'Invalid image source: only Ximilar URLs are allowed' }
    }

    // Ensure HTTPS only
    if (url.protocol !== 'https:') {
      return { path: '', error: 'Invalid image source: HTTPS required' }
    }

    // Download the external image
    const response = await fetch(sourceUrl)

    if (!response.ok) {
      return { path: '', error: `Failed to download image: ${response.statusText}` }
    }

    // Determine content type - S3 often returns binary/octet-stream for images
    // so we need to detect from the URL extension or use a sensible default
    let contentType = response.headers.get('content-type') || ''

    // If content type is generic or missing, detect from filename/URL
    if (!contentType || contentType === 'binary/octet-stream' || contentType === 'application/octet-stream') {
      const extension = filename.split('.').pop()?.toLowerCase() || url.pathname.split('.').pop()?.toLowerCase()
      const extToMime: Record<string, string> = {
        'webp': 'image/webp',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
      }
      contentType = extToMime[extension || ''] || 'image/webp' // Ximilar returns webp by default
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const path = getImagePath(userId, collectionCardId, filename)

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.COLLECTION_CARD_IMAGES)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      return { path: '', error: error.message }
    }

    return { path, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error downloading image'
    return { path: '', error: message }
  }
}

/**
 * Deletes all images for a collection card
 * Called when a card is removed from collection
 *
 * @param userId - The user's ID
 * @param collectionCardId - The collection card ID
 */
export async function deleteCardImages(
  userId: string,
  collectionCardId: string
): Promise<{ error: string | null }> {
  const supabase = getServerSupabaseClient()

  const folderPath = `${userId}/${collectionCardId}`

  // List all files in the card's folder
  const { data: files, error: listError } = await supabase.storage
    .from(STORAGE_BUCKETS.COLLECTION_CARD_IMAGES)
    .list(folderPath)

  if (listError) {
    return { error: listError.message }
  }

  if (!files || files.length === 0) {
    return { error: null } // No files to delete
  }

  // Delete all files in the folder
  const filePaths = files.map((file) => `${folderPath}/${file.name}`)

  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKETS.COLLECTION_CARD_IMAGES)
    .remove(filePaths)

  if (deleteError) {
    return { error: deleteError.message }
  }

  return { error: null }
}

/**
 * Gets the full storage URL for an image path
 * Note: Since bucket is private, this returns a path reference, not a public URL
 *
 * @param storagePath - The path within the storage bucket
 * @returns The full storage path reference
 */
export function getStoragePath(storagePath: string): string {
  return `${STORAGE_BUCKETS.COLLECTION_CARD_IMAGES}/${storagePath}`
}
