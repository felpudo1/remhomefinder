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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          contact_email: string
          contact_name: string
          contact_person_phone: string
          contact_phone: string
          created_at: string
          created_by: string
          description: string
          id: string
          logo_url: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_email?: string
          contact_name?: string
          contact_person_phone?: string
          contact_phone?: string
          created_at?: string
          created_by: string
          description?: string
          id?: string
          logo_url?: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_person_phone?: string
          contact_phone?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          logo_url?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_members: {
        Row: {
          agency_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          invite_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          invite_code?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          invite_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_properties: {
        Row: {
          agency_id: string
          created_at: string
          currency: string
          description: string
          id: string
          images: string[]
          listing_type: Database["public"]["Enums"]["listing_type"]
          neighborhood: string
          price_expenses: number
          price_rent: number
          rooms: number
          sq_meters: number
          status: Database["public"]["Enums"]["marketplace_property_status"]
          title: string
          total_cost: number
          updated_at: string
          url: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          images?: string[]
          listing_type?: Database["public"]["Enums"]["listing_type"]
          neighborhood?: string
          price_expenses?: number
          price_rent?: number
          rooms?: number
          sq_meters?: number
          status?: Database["public"]["Enums"]["marketplace_property_status"]
          title: string
          total_cost?: number
          updated_at?: string
          url?: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
          images?: string[]
          listing_type?: Database["public"]["Enums"]["listing_type"]
          neighborhood?: string
          price_expenses?: number
          price_rent?: number
          rooms?: number
          sq_meters?: number
          status?: Database["public"]["Enums"]["marketplace_property_status"]
          title?: string
          total_cost?: number
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_properties_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string
          display_name: string
          id: string
          phone: string
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          display_name?: string
          id?: string
          phone?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          display_name?: string
          id?: string
          phone?: string
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          ai_summary: string
          admin_hidden: boolean
          admin_hidden_at: string | null
          admin_hidden_by: string | null
          contacted_name: string | null
          coordinated_date: string | null
          created_at: string
          created_by_email: string
          currency: string
          deleted_by_email: string | null
          deleted_reason: string | null
          discarded_by_email: string | null
          discarded_reason: string | null
          group_id: string | null
          id: string
          images: string[]
          listing_type: Database["public"]["Enums"]["listing_type"]
          marketplace_status:
          | Database["public"]["Enums"]["marketplace_property_status"]
          | null
          neighborhood: string
          price_expenses: number
          price_rent: number
          rooms: number
          source_marketplace_id: string | null
          sq_meters: number
          status: Database["public"]["Enums"]["property_status"]
          status_changed_by: string | null
          status_changed_by_email: string | null
          title: string
          total_cost: number
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          ai_summary?: string
          admin_hidden?: boolean
          admin_hidden_at?: string | null
          admin_hidden_by?: string | null
          contacted_name?: string | null
          coordinated_date?: string | null
          created_at?: string
          created_by_email?: string
          currency?: string
          deleted_by_email?: string | null
          deleted_reason?: string | null
          discarded_by_email?: string | null
          discarded_reason?: string | null
          group_id?: string | null
          id?: string
          images?: string[]
          listing_type?: Database["public"]["Enums"]["listing_type"]
          marketplace_status?:
          | Database["public"]["Enums"]["marketplace_property_status"]
          | null
          neighborhood?: string
          price_expenses?: number
          price_rent?: number
          rooms?: number
          source_marketplace_id?: string | null
          sq_meters?: number
          status?: Database["public"]["Enums"]["property_status"]
          status_changed_by?: string | null
          status_changed_by_email?: string | null
          title: string
          total_cost?: number
          updated_at?: string
          url?: string
          user_id: string
        }
        Update: {
          ai_summary?: string
          admin_hidden?: boolean
          admin_hidden_at?: string | null
          admin_hidden_by?: string | null
          contacted_name?: string | null
          coordinated_date?: string | null
          created_at?: string
          created_by_email?: string
          currency?: string
          deleted_by_email?: string | null
          deleted_reason?: string | null
          discarded_by_email?: string | null
          discarded_reason?: string | null
          group_id?: string | null
          id?: string
          images?: string[]
          listing_type?: Database["public"]["Enums"]["listing_type"]
          marketplace_status?:
          | Database["public"]["Enums"]["marketplace_property_status"]
          | null
          neighborhood?: string
          price_expenses?: number
          price_rent?: number
          rooms?: number
          source_marketplace_id?: string | null
          sq_meters?: number
          status?: Database["public"]["Enums"]["property_status"]
          status_changed_by?: string | null
          status_changed_by_email?: string | null
          title?: string
          total_cost?: number
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_source_marketplace_id_fkey"
            columns: ["source_marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplace_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_comments: {
        Row: {
          author: string
          avatar: string
          created_at: string
          id: string
          property_id: string
          text: string
          user_id: string
        }
        Insert: {
          author: string
          avatar?: string
          created_at?: string
          id?: string
          property_id: string
          text: string
          user_id: string
        }
        Update: {
          author?: string
          avatar?: string
          created_at?: string
          id?: string
          property_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_comments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_profile_status: {
        Args: {
          _status: Database["public"]["Enums"]["user_status"]
          _user_id: string
        }
        Returns: undefined
      }
      find_group_by_invite_code: {
        Args: { _code: string }
        Returns: {
          description: string
          id: string
          name: string
        }[]
      }
      get_agency_dashboard_stats: {
        Args: { p_agency_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      agency_status: "pending" | "approved" | "rejected" | "suspended"
      app_role: "user" | "agency" | "admin"
      listing_type: "rent" | "sale"
      marketplace_property_status:
      | "active"
      | "paused"
      | "sold"
      | "reserved"
      | "rented"
      | "deleted"
      property_status:
      | "contacted"
      | "coordinated"
      | "visited"
      | "discarded"
      | "ingresado"
      | "a_analizar"
      | "eliminado"
      user_status: "active" | "pending" | "suspended" | "rejected"
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
      agency_status: ["pending", "approved", "rejected", "suspended"],
      app_role: ["user", "agency", "admin"],
      listing_type: ["rent", "sale"],
      marketplace_property_status: [
        "active",
        "paused",
        "sold",
        "reserved",
        "rented",
        "deleted",
      ],
      property_status: [
        "contacted",
        "coordinated",
        "visited",
        "discarded",
        "ingresado",
        "a_analizar",
        "eliminado",
      ],
      user_status: ["active", "pending", "suspended", "rejected"],
    },
  },
} as const
