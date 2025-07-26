export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          analyze_details: Json | null
          back_exact_overlay_url: string | null
          back_full_overlay_url: string | null
          back_image_url: string | null
          card_number: string | null
          card_set: string | null
          card_title: string | null
          confidence: number | null
          created_at: string | null
          estimated_grade: number | null
          front_exact_overlay_url: string | null
          front_full_overlay_url: string | null
          front_image_url: string | null
          graded_prices: Json | null
          grading_details: Json | null
          id: string
          links: Json | null
          out_of: string | null
          price_date: string | null
          rarity: string | null
          series: string | null
          set_code: string | null
          set_series_code: string | null
          subcategory: string | null
          ungraded_price: number | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          analyze_details?: Json | null
          back_exact_overlay_url?: string | null
          back_full_overlay_url?: string | null
          back_image_url?: string | null
          card_number?: string | null
          card_set?: string | null
          card_title?: string | null
          confidence?: number | null
          created_at?: string | null
          estimated_grade?: number | null
          front_exact_overlay_url?: string | null
          front_full_overlay_url?: string | null
          front_image_url?: string | null
          graded_prices?: Json | null
          grading_details?: Json | null
          id?: string
          links?: Json | null
          out_of?: string | null
          price_date?: string | null
          rarity?: string | null
          series?: string | null
          set_code?: string | null
          set_series_code?: string | null
          subcategory?: string | null
          ungraded_price?: number | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          analyze_details?: Json | null
          back_exact_overlay_url?: string | null
          back_full_overlay_url?: string | null
          back_image_url?: string | null
          card_number?: string | null
          card_set?: string | null
          card_title?: string | null
          confidence?: number | null
          created_at?: string | null
          estimated_grade?: number | null
          front_exact_overlay_url?: string | null
          front_full_overlay_url?: string | null
          front_image_url?: string | null
          graded_prices?: Json | null
          grading_details?: Json | null
          id?: string
          links?: Json | null
          out_of?: string | null
          price_date?: string | null
          rarity?: string | null
          series?: string | null
          set_code?: string | null
          set_series_code?: string | null
          subcategory?: string | null
          ungraded_price?: number | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      pokemon_cards: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          illustrator: string | null
          image: string | null
          local_id: string | null
          name: string
          rarity: string | null
          set_id: string | null
          updated_at: string | null
          variant_first_edition: boolean | null
          variant_holo: boolean | null
          variant_normal: boolean | null
          variant_reverse: boolean | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id: string
          illustrator?: string | null
          image?: string | null
          local_id?: string | null
          name: string
          rarity?: string | null
          set_id?: string | null
          updated_at?: string | null
          variant_first_edition?: boolean | null
          variant_holo?: boolean | null
          variant_normal?: boolean | null
          variant_reverse?: boolean | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          illustrator?: string | null
          image?: string | null
          local_id?: string | null
          name?: string
          rarity?: string | null
          set_id?: string | null
          updated_at?: string | null
          variant_first_edition?: boolean | null
          variant_holo?: boolean | null
          variant_normal?: boolean | null
          variant_reverse?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "pokemon_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_series: {
        Row: {
          created_at: string | null
          id: string
          logo: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          logo?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pokemon_sets: {
        Row: {
          card_count_first_ed: number | null
          card_count_holo: number | null
          card_count_official: number | null
          card_count_reverse: number | null
          card_count_total: number | null
          created_at: string | null
          id: string
          logo: string | null
          name: string
          release_date: string | null
          series_id: string | null
          symbol: string | null
          updated_at: string | null
        }
        Insert: {
          card_count_first_ed?: number | null
          card_count_holo?: number | null
          card_count_official?: number | null
          card_count_reverse?: number | null
          card_count_total?: number | null
          created_at?: string | null
          id: string
          logo?: string | null
          name: string
          release_date?: string | null
          series_id?: string | null
          symbol?: string | null
          updated_at?: string | null
        }
        Update: {
          card_count_first_ed?: number | null
          card_count_holo?: number | null
          card_count_official?: number | null
          card_count_reverse?: number | null
          card_count_total?: number | null
          created_at?: string | null
          id?: string
          logo?: string | null
          name?: string
          release_date?: string | null
          series_id?: string | null
          symbol?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_sets_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "pokemon_series"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits_remaining: number
          id: string
          total_credits_purchased: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number
          id?: string
          total_credits_purchased?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_credits: {
        Args: { user_id: string; credits_to_add: number }
        Returns: boolean
      }
      deduct_user_credit: {
        Args: { user_id: string }
        Returns: boolean
      }
      initialize_user_credits: {
        Args: { user_id: string; initial_credits?: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
