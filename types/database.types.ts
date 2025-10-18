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
      agent_generations: {
        Row: {
          agent_type: string
          created_at: string
          generation_time_ms: number | null
          id: string
          input_context: Json
          metadata: Json | null
          model_version: string
          output_content: Json
          round_id: string | null
          session_id: string | null
          safety_flags: string[]
          tokens_used: number | null
        }
        Insert: {
          agent_type: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          input_context: Json
          metadata?: Json | null
          model_version: string
          output_content: Json
          round_id?: string | null
          session_id?: string | null
          safety_flags?: string[]
          tokens_used?: number | null
        }
        Update: {
          agent_type?: string
          created_at?: string
          generation_time_ms?: number | null
          id?: string
          input_context?: Json
          metadata?: Json | null
          model_version?: string
          output_content?: Json
          round_id?: string | null
          session_id?: string | null
          safety_flags?: string[]
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_generations_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "emotion_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_generations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age_band: string
          avatar_emoji: string
          created_at: string
          id: string
          nickname: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          age_band: string
          avatar_emoji?: string
          created_at?: string
          id?: string
          nickname: string
          parent_id: string
          updated_at?: string
        }
        Update: {
          age_band?: string
          avatar_emoji?: string
          created_at?: string
          id?: string
          nickname?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      emotion_rounds: {
        Row: {
          action_agent_praise: string | null
          action_agent_script: Json | null
          action_agent_story: Json | null
          completed_at: string | null
          generation_metadata: Json | null
          id: string
          is_correct: boolean | null
          labeled_emotion: string | null
          observer_context: Json | null
          post_intensity: number | null
          praise_message: string | null
          pre_intensity: number | null
          regulation_script_id: string | null
          round_number: number
          session_id: string
          started_at: string
          story_id: string
        }
        Insert: {
          action_agent_praise?: string | null
          action_agent_script?: Json | null
          action_agent_story?: Json | null
          completed_at?: string | null
          generation_metadata?: Json | null
          id?: string
          is_correct?: boolean | null
          labeled_emotion?: string | null
          observer_context?: Json | null
          post_intensity?: number | null
          praise_message?: string | null
          pre_intensity?: number | null
          regulation_script_id?: string | null
          round_number: number
          session_id: string
          started_at?: string
          story_id: string
        }
        Update: {
          action_agent_praise?: string | null
          action_agent_script?: Json | null
          action_agent_story?: Json | null
          completed_at?: string | null
          generation_metadata?: Json | null
          id?: string
          is_correct?: boolean | null
          labeled_emotion?: string | null
          observer_context?: Json | null
          post_intensity?: number | null
          praise_message?: string | null
          pre_intensity?: number | null
          regulation_script_id?: string | null
          round_number?: number
          session_id?: string
          started_at?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_rounds_regulation_script_id_fkey"
            columns: ["regulation_script_id"]
            isOneToOne: false
            referencedRelation: "regulation_scripts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotion_rounds_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emotion_rounds_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_feedback: {
        Row: {
          child_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          session_id: string
        }
        Insert: {
          child_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          session_id: string
        }
        Update: {
          child_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_feedback_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_feedback_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      regulation_scripts: {
        Row: {
          created_at: string
          description: string
          duration_seconds: number
          icon_emoji: string
          id: string
          name: string
          recommended_for_emotions: string[]
          recommended_for_intensities: number[]
          steps: Json
        }
        Insert: {
          created_at?: string
          description: string
          duration_seconds: number
          icon_emoji: string
          id: string
          name: string
          recommended_for_emotions: string[]
          recommended_for_intensities: number[]
          steps: Json
        }
        Update: {
          created_at?: string
          description?: string
          duration_seconds?: number
          icon_emoji?: string
          id?: string
          name?: string
          recommended_for_emotions?: string[]
          recommended_for_intensities?: number[]
          steps?: Json
        }
        Relationships: []
      }
      safety_alerts: {
        Row: {
          child_id: string
          created_at: string
          id: string
          matched_keywords: string[]
          parent_notified: boolean
          parent_notified_at: string | null
          session_id: string | null
          severity: string
          trigger_text: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          matched_keywords: string[]
          parent_notified?: boolean
          parent_notified_at?: string | null
          session_id?: string | null
          severity: string
          trigger_text: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          matched_keywords?: string[]
          parent_notified?: boolean
          parent_notified_at?: string | null
          session_id?: string | null
          severity?: string
          trigger_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_alerts_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_alerts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          agent_enabled: boolean
          child_id: string
          completed_at: string | null
          completed_rounds: number
          cumulative_context: Json | null
          id: string
          started_at: string
          story_ids: string[]
          total_rounds: number
        }
        Insert: {
          agent_enabled?: boolean
          child_id: string
          completed_at?: string | null
          completed_rounds?: number
          cumulative_context?: Json | null
          id?: string
          started_at?: string
          story_ids?: string[]
          total_rounds?: number
        }
        Update: {
          agent_enabled?: boolean
          child_id?: string
          completed_at?: string | null
          completed_rounds?: number
          cumulative_context?: Json | null
          id?: string
          started_at?: string
          story_ids?: string[]
          total_rounds?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          age_band: string
          complexity_score: number
          created_at: string
          emotion: string
          id: string
          text: string
          title: string
        }
        Insert: {
          age_band: string
          complexity_score: number
          created_at?: string
          emotion: string
          id: string
          text: string
          title: string
        }
        Update: {
          age_band?: string
          complexity_score?: number
          created_at?: string
          emotion?: string
          id?: string
          text?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
