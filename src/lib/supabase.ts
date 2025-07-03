import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cards: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          front_image_url?: string | null
          back_image_url?: string | null
          card_title?: string | null
          estimated_grade?: number | null
          confidence?: number | null
          grading_details?: Json | null
          ungraded_price?: number | null
          graded_prices?: Json | null
          price_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          front_image_url?: string | null
          back_image_url?: string | null
          card_title?: string | null
          estimated_grade?: number | null
          confidence?: number | null
          grading_details?: Json | null
          ungraded_price?: number | null
          graded_prices?: Json | null
          price_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits_remaining: number
          total_credits_purchased: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_remaining?: number
          total_credits_purchased?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits_remaining?: number
          total_credits_purchased?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}