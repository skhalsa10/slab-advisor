import { createClient } from '@supabase/supabase-js'
import { Card, CardInsert, CardUpdate, UserCredits, UserCreditsInsert, UserCreditsUpdate } from '@/types/database'

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
        Row: Card
        Insert: CardInsert
        Update: CardUpdate
      }
      user_credits: {
        Row: UserCredits
        Insert: UserCreditsInsert
        Update: UserCreditsUpdate
      }
    }
  }
}