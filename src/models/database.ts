export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      collection_cards: {
        Row: {
          acquisition_date: string | null
          acquisition_price: number | null
          back_image_url: string | null
          card_type: string | null
          condition: string | null
          created_at: string | null
          estimated_grade: number | null
          front_image_url: string | null
          grading_data: Json | null
          id: string
          manual_card_name: string | null
          manual_card_number: string | null
          manual_rarity: string | null
          manual_series: string | null
          manual_set_name: string | null
          manual_year: number | null
          notes: string | null
          pokemon_card_id: string | null
          quantity: number | null
          updated_at: string | null
          user_id: string
          variant: string
          variant_pattern: string | null
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_price?: number | null
          back_image_url?: string | null
          card_type?: string | null
          condition?: string | null
          created_at?: string | null
          estimated_grade?: number | null
          front_image_url?: string | null
          grading_data?: Json | null
          id?: string
          manual_card_name?: string | null
          manual_card_number?: string | null
          manual_rarity?: string | null
          manual_series?: string | null
          manual_set_name?: string | null
          manual_year?: number | null
          notes?: string | null
          pokemon_card_id?: string | null
          quantity?: number | null
          updated_at?: string | null
          user_id: string
          variant: string
          variant_pattern?: string | null
        }
        Update: {
          acquisition_date?: string | null
          acquisition_price?: number | null
          back_image_url?: string | null
          card_type?: string | null
          condition?: string | null
          created_at?: string | null
          estimated_grade?: number | null
          front_image_url?: string | null
          grading_data?: Json | null
          id?: string
          manual_card_name?: string | null
          manual_card_number?: string | null
          manual_rarity?: string | null
          manual_series?: string | null
          manual_set_name?: string | null
          manual_year?: number | null
          notes?: string | null
          pokemon_card_id?: string | null
          quantity?: number | null
          updated_at?: string | null
          user_id?: string
          variant?: string
          variant_pattern?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_cards_pokemon_card_id_fkey"
            columns: ["pokemon_card_id"]
            isOneToOne: false
            referencedRelation: "pokemon_cards"
            referencedColumns: ["id"]
          },
        ]
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
          price_data: Json | null
          price_last_updated: string | null
          rarity: string | null
          set_id: string | null
          tcgplayer_image_url: string | null
          tcgplayer_product_id: number | null
          tcgplayer_products: Json | null
          updated_at: string | null
          variant_first_edition: boolean | null
          variant_holo: boolean | null
          variant_master_ball: boolean | null
          variant_normal: boolean | null
          variant_poke_ball: boolean | null
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
          price_data?: Json | null
          price_last_updated?: string | null
          rarity?: string | null
          set_id?: string | null
          tcgplayer_image_url?: string | null
          tcgplayer_product_id?: number | null
          tcgplayer_products?: Json | null
          updated_at?: string | null
          variant_first_edition?: boolean | null
          variant_holo?: boolean | null
          variant_master_ball?: boolean | null
          variant_normal?: boolean | null
          variant_poke_ball?: boolean | null
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
          price_data?: Json | null
          price_last_updated?: string | null
          rarity?: string | null
          set_id?: string | null
          tcgplayer_image_url?: string | null
          tcgplayer_product_id?: number | null
          tcgplayer_products?: Json | null
          updated_at?: string | null
          variant_first_edition?: boolean | null
          variant_holo?: boolean | null
          variant_master_ball?: boolean | null
          variant_normal?: boolean | null
          variant_poke_ball?: boolean | null
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
      pokemon_products: {
        Row: {
          created_at: string | null
          id: number
          name: string
          pokemon_set_id: string | null
          price_data: Json | null
          price_last_updated: string | null
          tcgplayer_group_id: number
          tcgplayer_image_url: string | null
          tcgplayer_product_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          pokemon_set_id?: string | null
          price_data?: Json | null
          price_last_updated?: string | null
          tcgplayer_group_id: number
          tcgplayer_image_url?: string | null
          tcgplayer_product_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          pokemon_set_id?: string | null
          price_data?: Json | null
          price_last_updated?: string | null
          tcgplayer_group_id?: number
          tcgplayer_image_url?: string | null
          tcgplayer_product_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_products_pokemon_set_id_fkey"
            columns: ["pokemon_set_id"]
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
          ptcgio_id: string | null
          release_date: string | null
          secondary_logo: string | null
          secondary_symbol: string | null
          series_id: string | null
          symbol: string | null
          tcgplayer_group_id: number | null
          tcgplayer_groups: Json | null
          tcgplayer_url: string | null
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
          ptcgio_id?: string | null
          release_date?: string | null
          secondary_logo?: string | null
          secondary_symbol?: string | null
          series_id?: string | null
          symbol?: string | null
          tcgplayer_group_id?: number | null
          tcgplayer_groups?: Json | null
          tcgplayer_url?: string | null
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
          ptcgio_id?: string | null
          release_date?: string | null
          secondary_logo?: string | null
          secondary_symbol?: string | null
          series_id?: string | null
          symbol?: string | null
          tcgplayer_group_id?: number | null
          tcgplayer_groups?: Json | null
          tcgplayer_url?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_public: boolean
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits_remaining: number | null
          free_credits: number
          free_credits_reset_at: string
          id: string
          purchased_credits: number
          total_credits_purchased: number
          total_free_credits_used: number
          total_purchased_credits_used: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_remaining?: number | null
          free_credits?: number
          free_credits_reset_at?: string
          id?: string
          purchased_credits?: number
          total_credits_purchased?: number
          total_free_credits_used?: number
          total_purchased_credits_used?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_remaining?: number | null
          free_credits?: number
          free_credits_reset_at?: string
          id?: string
          purchased_credits?: number
          total_credits_purchased?: number
          total_free_credits_used?: number
          total_purchased_credits_used?: number
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
      add_purchased_credits: {
        Args: {
          p_credits: number
          p_transaction_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      check_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      create_user_profile: {
        Args: { p_user_id: string; p_username: string }
        Returns: Json
      }
      deduct_user_credit: { Args: { p_user_id: string }; Returns: Json }
      get_set_tcgplayer_groups: { Args: { set_id: string }; Returns: Json }
      get_user_credit_details: { Args: { p_user_id: string }; Returns: Json }
      reset_monthly_free_credits: {
        Args: never
        Returns: {
          credits_reset: number
          user_id: string
        }[]
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
