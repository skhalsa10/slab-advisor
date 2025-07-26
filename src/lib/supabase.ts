import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/models/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Re-export commonly used types for backward compatibility
export type { Database, Json } from '@/models/database'

// Export properly named types to avoid confusion
export type { 
  CollectionCard, 
  CollectionCardInsert, 
  CollectionCardUpdate,
  UserCredits, 
  UserCreditsInsert, 
  UserCreditsUpdate,
  // Legacy aliases for backward compatibility
  Card,
  CardInsert,
  CardUpdate
} from '@/types/database'