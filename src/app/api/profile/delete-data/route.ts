/**
 * Delete User Data API
 *
 * DELETE /api/profile/delete-data
 *
 * GDPR-compliant deletion of all personal user data.
 * User keeps their account but all collection data is removed.
 * Requires authentication and explicit confirmation string.
 *
 * Uses service role client (via getServerSupabaseClient) to bypass RLS
 * for complete data deletion including nested storage files.
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { checkRateLimit } from '@/middleware/rateLimit'
import {
  getAuthenticatedSupabaseClient,
  getServerSupabaseClient,
} from '@/lib/supabase-server'

const CONFIRMATION_STRING = 'DELETE ALL MY DATA'

interface DeletionCounts {
  gradings: number
  cards: number
  products: number
  snapshots: number
  storageFiles: number
}

export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting - 3 requests per hour (very restrictive for destructive operation)
    const rateLimitResponse = await checkRateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    })

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Parse and validate confirmation
    const body = await request.json()
    const { confirmation } = body

    if (confirmation !== CONFIRMATION_STRING) {
      return NextResponse.json(
        { success: false, error: 'Invalid confirmation. Please type "DELETE ALL MY DATA" exactly.' },
        { status: 400 }
      )
    }

    // Get authenticated client to verify user identity
    const supabaseAuth = await getAuthenticatedSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get service role client to bypass RLS for deletion operations
    const supabaseAdmin = getServerSupabaseClient()

    // Execute deletion with Sentry tracing
    return await Sentry.startSpan(
      {
        op: 'db.delete_user_data',
        name: 'Delete All User Data (GDPR)',
      },
      async (span) => {
        span.setAttribute('user_id', user.id)

        const counts: DeletionCounts = {
          gradings: 0,
          cards: 0,
          products: 0,
          snapshots: 0,
          storageFiles: 0,
        }

        try {
          // Step 1: Delete collection_card_gradings (FK to collection_cards - must delete first)
          const { data: gradingsData, error: gradingsError } = await supabaseAdmin
            .from('collection_card_gradings')
            .delete()
            .eq('user_id', user.id)
            .select('id')

          if (gradingsError) {
            throw new Error(`Failed to delete gradings: ${gradingsError.message}`)
          }
          counts.gradings = gradingsData?.length || 0
          span.setAttribute('gradings_deleted', counts.gradings)

          // Step 2: Delete collection_cards
          const { data: cardsData, error: cardsError } = await supabaseAdmin
            .from('collection_cards')
            .delete()
            .eq('user_id', user.id)
            .select('id')

          if (cardsError) {
            throw new Error(`Failed to delete cards: ${cardsError.message}`)
          }
          counts.cards = cardsData?.length || 0
          span.setAttribute('cards_deleted', counts.cards)

          // Step 3: Delete collection_products
          const { data: productsData, error: productsError } = await supabaseAdmin
            .from('collection_products')
            .delete()
            .eq('user_id', user.id)
            .select('id')

          if (productsError) {
            throw new Error(`Failed to delete products: ${productsError.message}`)
          }
          counts.products = productsData?.length || 0
          span.setAttribute('products_deleted', counts.products)

          // Step 4: Delete portfolio_snapshots
          const { data: snapshotsData, error: snapshotsError } = await supabaseAdmin
            .from('portfolio_snapshots')
            .delete()
            .eq('user_id', user.id)
            .select('id')

          if (snapshotsError) {
            throw new Error(`Failed to delete snapshots: ${snapshotsError.message}`)
          }
          counts.snapshots = snapshotsData?.length || 0
          span.setAttribute('snapshots_deleted', counts.snapshots)

          // Step 5: Delete storage files from collection-card-images/{user_id}/
          // Use recursive listing via Storage API to get all nested file paths
          const allFilePaths: string[] = []
          const storageBucket = supabaseAdmin.storage.from('collection-card-images')

          // List top-level items in user folder (these are card_id subfolders)
          const { data: topLevelItems, error: listError } = await storageBucket.list(user.id)

          if (listError) {
            console.warn('Error listing storage folder:', listError.message)
          } else if (topLevelItems && topLevelItems.length > 0) {
            // For each subfolder (card_id), list its files
            for (const item of topLevelItems) {
              if (item.id === null) {
                // This is a folder - list its contents
                const { data: subfolderFiles, error: subfolderError } = await storageBucket.list(
                  `${user.id}/${item.name}`
                )

                if (subfolderError) {
                  console.warn(`Error listing subfolder ${item.name}:`, subfolderError.message)
                } else if (subfolderFiles) {
                  // Add each file with full path
                  for (const file of subfolderFiles) {
                    if (file.id !== null) {
                      // This is an actual file
                      allFilePaths.push(`${user.id}/${item.name}/${file.name}`)
                    }
                  }
                }
              } else {
                // This is a file at the top level (shouldn't happen but handle it)
                allFilePaths.push(`${user.id}/${item.name}`)
              }
            }

            // Delete all files in batches of 1000
            if (allFilePaths.length > 0) {
              const batchSize = 1000
              for (let i = 0; i < allFilePaths.length; i += batchSize) {
                const batch = allFilePaths.slice(i, i + batchSize)
                const { error: removeError } = await storageBucket.remove(batch)

                if (removeError) {
                  console.warn(`Error removing storage batch ${i / batchSize + 1}:`, removeError.message)
                }
              }
            }
            counts.storageFiles = allFilePaths.length
          }
          span.setAttribute('storage_files_deleted', counts.storageFiles)

          // Step 6: Clear profiles fields (NOT delete row - keep username)
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
              display_name: null,
              bio: null,
              avatar_url: null,
              is_public: false,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)

          if (profileError) {
            throw new Error(`Failed to clear profile: ${profileError.message}`)
          }

          // Track successful deletion metric
          Sentry.metrics.count('user_data_deleted', 1, {
            attributes: { status: 'success' },
          })

          return NextResponse.json({
            success: true,
            message: 'All user data has been deleted',
            counts: {
              cardsDeleted: counts.cards,
              gradingsDeleted: counts.gradings,
              productsDeleted: counts.products,
              snapshotsDeleted: counts.snapshots,
              storageFilesDeleted: counts.storageFiles,
            },
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          Sentry.captureException(error, {
            tags: { api: 'profile/delete-data', operation: 'delete_all_user_data' },
            extra: { userId: user.id, counts },
          })

          // Track failed deletion metric
          Sentry.metrics.count('user_data_deleted', 1, {
            attributes: { status: 'error' },
          })

          return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
          )
        }
      }
    )
  } catch (error) {
    Sentry.captureException(error, {
      tags: { api: 'profile/delete-data', operation: 'delete_all_user_data' },
    })
    console.error('Delete user data error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
