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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          assignment_title: string
          business_context: string
          created_at: string
          created_by: string
          generated_at: string
          id: string
          organization_id: string
          result: Json
          source_filename: string | null
          source_text: string | null
          updated_at: string
        }
        Insert: {
          assignment_title: string
          business_context?: string
          created_at?: string
          created_by: string
          generated_at: string
          id?: string
          organization_id: string
          result: Json
          source_filename?: string | null
          source_text?: string | null
          updated_at?: string
        }
        Update: {
          assignment_title?: string
          business_context?: string
          created_at?: string
          created_by?: string
          generated_at?: string
          id?: string
          organization_id?: string
          result?: Json
          source_filename?: string | null
          source_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          change_summary: Json
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: number
          organization_id: string
        }
        Insert: {
          actor_user_id?: string | null
          change_summary: Json
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: never
          organization_id: string
        }
        Update: {
          actor_user_id?: string | null
          change_summary?: Json
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: never
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_records: {
        Row: {
          analysis_id: string
          created_at: string
          created_by: string
          decided_at: string | null
          decided_by: string | null
          decision_key: string
          id: string
          note: string
          organization_id: string
          position: number
          status: Database["public"]["Enums"]["decision_status"]
          updated_at: string
        }
        Insert: {
          analysis_id: string
          created_at?: string
          created_by: string
          decided_at?: string | null
          decided_by?: string | null
          decision_key: string
          id?: string
          note?: string
          organization_id: string
          position: number
          status?: Database["public"]["Enums"]["decision_status"]
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          created_at?: string
          created_by?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_key?: string
          id?: string
          note?: string
          organization_id?: string
          position?: number
          status?: Database["public"]["Enums"]["decision_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_analysis_org_fkey"
            columns: ["analysis_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          created_by: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_items: {
        Row: {
          action_key: string
          analysis_id: string
          created_at: string
          created_by: string
          due_date: string | null
          id: string
          organization_id: string
          owner_name: string
          priority: Database["public"]["Enums"]["action_priority"]
          progress_note: string
          rationale: string
          recommended_agent: string
          status: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at: string
          verification: string
        }
        Insert: {
          action_key: string
          analysis_id: string
          created_at?: string
          created_by: string
          due_date?: string | null
          id?: string
          organization_id: string
          owner_name?: string
          priority?: Database["public"]["Enums"]["action_priority"]
          progress_note?: string
          rationale?: string
          recommended_agent: string
          status?: Database["public"]["Enums"]["action_status"]
          title: string
          updated_at?: string
          verification?: string
        }
        Update: {
          action_key?: string
          analysis_id?: string
          created_at?: string
          created_by?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          owner_name?: string
          priority?: Database["public"]["Enums"]["action_priority"]
          progress_note?: string
          rationale?: string
          recommended_agent?: string
          status?: Database["public"]["Enums"]["action_status"]
          title?: string
          updated_at?: string
          verification?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_items_analysis_org_fkey"
            columns: ["analysis_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "work_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      action_priority: "urgent" | "high" | "normal" | "low"
      action_status:
        | "proposed"
        | "approved"
        | "in_progress"
        | "blocked"
        | "done"
      decision_status: "pending" | "approved" | "deferred"
      organization_role: "owner" | "admin" | "member" | "viewer"
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
      action_priority: ["urgent", "high", "normal", "low"],
      action_status: ["proposed", "approved", "in_progress", "blocked", "done"],
      decision_status: ["pending", "approved", "deferred"],
      organization_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
