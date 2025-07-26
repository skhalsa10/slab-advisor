import { Json } from '@/lib/supabase'

// Card category enum for future use
export type CardCategory = 'pokemon' | 'onepiece' | 'sports' | 'other_tcg'

// User Collection Cards table - cards that users upload and analyze
export interface CollectionCard {
  id: string
  user_id: string
  front_image_url: string | null
  back_image_url: string | null
  card_title: string | null
  estimated_grade: number | null
  confidence: number | null
  grading_details: Json | null
  ungraded_price: number | null
  graded_prices: Json | null
  price_date: string | null
  
  // Card identification fields from 11-card-identification-fields.sql
  card_set: string | null
  rarity: string | null
  out_of: string | null
  card_number: string | null
  set_series_code: string | null
  set_code: string | null
  series: string | null
  year: number | null
  subcategory: string | null
  links: Json | null
  analyze_details: Json | null
  
  // Overlay image fields from analyze-card API
  front_full_overlay_url: string | null
  front_exact_overlay_url: string | null
  back_full_overlay_url: string | null
  back_exact_overlay_url: string | null
  
  created_at: string | null
  updated_at: string | null
}

// User Credits table
export interface UserCredits {
  id: string
  user_id: string
  credits_remaining: number
  total_credits_purchased: number
  created_at: string | null
  updated_at: string | null
}

// Database insert/update types
export type CollectionCardInsert = Omit<CollectionCard, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type CollectionCardUpdate = Partial<Omit<CollectionCard, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}

// Legacy type aliases for backward compatibility
export type Card = CollectionCard
export type CardInsert = CollectionCardInsert
export type CardUpdate = CollectionCardUpdate

export type UserCreditsInsert = Omit<UserCredits, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type UserCreditsUpdate = Partial<Omit<UserCredits, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}