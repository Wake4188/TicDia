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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action_description: string
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          announcement_type: string
          content: string
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          priority: number
          starts_at: string | null
          target_audience: string
          title: string
          updated_at: string
        }
        Insert: {
          announcement_type?: string
          content: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_audience?: string
          title: string
          updated_at?: string
        }
        Update: {
          announcement_type?: string
          content?: string
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          target_audience?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_metrics: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_date: string
          metric_type: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type: string
          metric_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_date?: string
          metric_type?: string
          metric_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      article_votes: {
        Row: {
          article_id: string
          article_title: string
          article_url: string | null
          created_at: string
          id: string
          user_id: string
          vote_type: string
          voted_at: string
        }
        Insert: {
          article_id: string
          article_title: string
          article_url?: string | null
          created_at?: string
          id?: string
          user_id: string
          vote_type?: string
          voted_at?: string
        }
        Update: {
          article_id?: string
          article_title?: string
          article_url?: string | null
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
          voted_at?: string
        }
        Relationships: []
      }
      content_moderation: {
        Row: {
          admin_notes: string | null
          content_id: string
          content_title: string | null
          content_type: string
          created_at: string
          id: string
          is_hidden: boolean
          moderated_by: string | null
          moderation_status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          content_id: string
          content_title?: string | null
          content_type: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          moderated_by?: string | null
          moderation_status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          content_id?: string
          content_title?: string | null
          content_type?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          moderated_by?: string | null
          moderation_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_rules: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          reason: string | null
          rule_type: string
          target_type: string
          target_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          rule_type: string
          target_type: string
          target_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          rule_type?: string
          target_type?: string
          target_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_challenges: {
        Row: {
          category: string | null
          challenge_date: string
          challenge_description: string
          challenge_target: number
          challenge_type: string
          created_at: string
          id: string
        }
        Insert: {
          category?: string | null
          challenge_date?: string
          challenge_description: string
          challenge_target: number
          challenge_type: string
          created_at?: string
          id?: string
        }
        Update: {
          category?: string | null
          challenge_date?: string
          challenge_description?: string
          challenge_target?: number
          challenge_type?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feed_curation: {
        Row: {
          article_id: string
          article_title: string
          article_url: string | null
          created_at: string
          curated_by: string | null
          curation_type: string
          ends_at: string | null
          id: string
          is_active: boolean
          priority: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          article_title: string
          article_url?: string | null
          created_at?: string
          curated_by?: string | null
          curation_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          article_title?: string
          article_url?: string | null
          created_at?: string
          curated_by?: string | null
          curation_type?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_articles: {
        Row: {
          article_id: string
          article_title: string
          article_url: string | null
          id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          article_title: string
          article_url?: string | null
          id?: string
          saved_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          article_title?: string
          article_url?: string | null
          id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: []
      }
      today_articles: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_added: boolean
          title: string
          url: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_added?: boolean
          title: string
          url?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_added?: boolean
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_description: string
          achievement_name: string
          achievement_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_description?: string
          achievement_name?: string
          achievement_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          articles_viewed: number
          audio_articles_listened: number | null
          created_at: string
          current_scroll_streak: number
          daily_activity: Json | null
          favorite_topics: Json | null
          first_visit_date: string
          id: string
          last_activity_date: string
          longest_scroll_streak: number
          total_audio_time: number | null
          total_scroll_distance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          articles_viewed?: number
          audio_articles_listened?: number | null
          created_at?: string
          current_scroll_streak?: number
          daily_activity?: Json | null
          favorite_topics?: Json | null
          first_visit_date?: string
          id?: string
          last_activity_date?: string
          longest_scroll_streak?: number
          total_audio_time?: number | null
          total_scroll_distance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          articles_viewed?: number
          audio_articles_listened?: number | null
          created_at?: string
          current_scroll_streak?: number
          daily_activity?: Json | null
          favorite_topics?: Json | null
          first_visit_date?: string
          id?: string
          last_activity_date?: string
          longest_scroll_streak?: number
          total_audio_time?: number | null
          total_scroll_distance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_progress: {
        Row: {
          challenge_id: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          allow_adult_content: boolean | null
          background_opacity: number
          birth_year: number | null
          created_at: string
          feed_type: string | null
          font_family: string
          font_size: number | null
          highlight_color: string
          id: string
          liquid_glass_mode: boolean | null
          tts_autoplay: boolean
          tts_speed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_adult_content?: boolean | null
          background_opacity?: number
          birth_year?: number | null
          created_at?: string
          feed_type?: string | null
          font_family?: string
          font_size?: number | null
          highlight_color?: string
          id?: string
          liquid_glass_mode?: boolean | null
          tts_autoplay?: boolean
          tts_speed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_adult_content?: boolean | null
          background_opacity?: number
          birth_year?: number | null
          created_at?: string
          feed_type?: string | null
          font_family?: string
          font_size?: number | null
          highlight_color?: string
          id?: string
          liquid_glass_mode?: boolean | null
          tts_autoplay?: boolean
          tts_speed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      word_of_the_day: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_admin_selected: boolean
          updated_at: string
          word: string
          word_date: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_admin_selected?: boolean
          updated_at?: string
          word: string
          word_date?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_admin_selected?: boolean
          updated_at?: string
          word?: string
          word_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_data: { Args: never; Returns: undefined }
      get_article_vote_count: {
        Args: { p_article_id: string }
        Returns: number
      }
      get_top_voted_articles: {
        Args: { p_date?: string; p_limit?: number }
        Returns: {
          article_id: string
          article_title: string
          article_url: string
          vote_count: number
        }[]
      }
      get_word_of_the_day: {
        Args: { p_date?: string }
        Returns: {
          is_admin_selected: boolean
          word: string
          word_date: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_daily_vote_counts: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
