/**
 * Supabase Client module for Slab Advisor
 * 
 * This module provides the main Supabase client for client-side operations.
 * It uses the anonymous key for public operations and user authentication.
 * The client is configured with TypeScript types for type safety.
 * 
 * Usage:
 * - Import this client for all client-side database operations
 * - Client automatically handles authentication state
 * - Provides type-safe database operations through generated types
 * 
 * @module supabase
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/models/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Main Supabase client for client-side operations
 * 
 * This client is configured with TypeScript types for the database schema
 * and uses the anonymous key for public operations. Authentication is
 * handled automatically by Supabase based on user session state.
 * 
 * @example
 * ```typescript
 * import { supabase } from '@/lib/supabase'
 * 
 * // Query data
 * const { data, error } = await supabase
 *   .from('collection_cards')
 *   .select('*')
 *   .eq('user_id', userId)
 * 
 * // Insert data
 * const { error } = await supabase
 *   .from('collection_cards')
 *   .insert({ user_id: userId, card_name: 'Pikachu' })
 * ```
 */
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)

// Re-export commonly used types for backward compatibility
export type { Database, Json } from '@/models/database'

// Export properly named types to avoid confusion
export type { 
  CollectionCard, 
  CollectionCardInsert, 
  CollectionCardUpdate,
  UserCredits, 
  UserCreditsInsert, 
  UserCreditsUpdate
} from '@/types/database'