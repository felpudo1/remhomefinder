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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_keys: {
        Row: {
          created_at: string
          created_by: string
          created_by_name: string
          cuenta: string
          descripcion: string
          estado: string
          estado_updated_at: string
          fecha: string | null
          id: string
          texto: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          created_by_name?: string
          cuenta?: string
          descripcion?: string
          estado?: string
          estado_updated_at?: string
          fecha?: string | null
          id?: string
          texto?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          created_by_name?: string
          cuenta?: string
          descripcion?: string
          estado?: string
          estado_updated_at?: string
          fecha?: string | null
          id?: string
          texto?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agency_comments: {
        Row: {
          agent_pub_id: string
          author: string
          created_at: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          agent_pub_id: string
          author?: string
          created_at?: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          agent_pub_id?: string
          author?: string
          created_at?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_comments_agent_pub_id_fkey"
            columns: ["agent_pub_id"]
            isOneToOne: false
            referencedRelation: "agent_deserter_insights"
            referencedColumns: ["publication_id"]
          },
          {
            foreignKeyName: "agency_comments_agent_pub_id_fkey"
            columns: ["agent_pub_id"]
            isOneToOne: false
            referencedRelation: "agent_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agency_discovery_tasks: {
        Row: {
          completed_links: number
          created_at: string
          created_by: string
          domain_url: string
          failed_links: number
          id: string
          org_id: string
          status: string
          total_links: number
          updated_at: string
        }
        Insert: {
          completed_links?: number
          created_at?: string
          created_by: string
          domain_url: string
          failed_links?: number
          id?: string
          org_id: string
          status?: string
          total_links?: number
          updated_at?: string
        }
        Update: {
          completed_links?: number
          created_at?: string
          created_by?: string
          domain_url?: string
          failed_links?: number
          id?: string
          org_id?: string
          status?: string
          total_links?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_discovery_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_publications: {
        Row: {
          created_at: string
          description: string
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          org_id: string
          property_id: string
          published_by: string
          status: Database["public"]["Enums"]["agent_pub_status"]
          updated_at: string
          views_count: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          org_id: string
          property_id: string
          published_by: string
          status?: Database["public"]["Enums"]["agent_pub_status"]
          updated_at?: string
          views_count?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          org_id?: string
          property_id?: string
          published_by?: string
          status?: Database["public"]["Enums"]["agent_pub_status"]
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_publications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_publications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_publications_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: string
          metadata: Json | null
          org_id: string | null
          property_id: string
          source_publication_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json | null
          org_id?: string | null
          property_id: string
          source_publication_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: string
          metadata?: Json | null
          org_id?: string | null
          property_id?: string
          source_publication_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_source_publication_id_fkey"
            columns: ["source_publication_id"]
            isOneToOne: false
            referencedRelation: "agent_deserter_insights"
            referencedColumns: ["publication_id"]
          },
          {
            foreignKeyName: "analytics_events_source_publication_id_fkey"
            columns: ["source_publication_id"]
            isOneToOne: false
            referencedRelation: "agent_publications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          priority: Database["public"]["Enums"]["announcement_priority"]
          target_user_id: string | null
          title: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          priority?: Database["public"]["Enums"]["announcement_priority"]
          target_user_id?: string | null
          title: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["announcement_audience"]
          body?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          priority?: Database["public"]["Enums"]["announcement_priority"]
          target_user_id?: string | null
          title?: string
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cities: {
        Row: {
          country: string
          created_at: string
          department_id: string | null
          id: string
          name: string
        }
        Insert: {
          country?: string
          created_at?: string
          department_id?: string | null
          id?: string
          name: string
        }
        Update: {
          country?: string
          created_at?: string
          department_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_audit_log: {
        Row: {
          created_at: string
          deleted_by: string
          deleted_user_email: string | null
          deleted_user_id: string
          deleted_user_name: string | null
          id: string
          reason: string
        }
        Insert: {
          created_at?: string
          deleted_by: string
          deleted_user_email?: string | null
          deleted_user_id: string
          deleted_user_name?: string | null
          id?: string
          reason?: string
        }
        Update: {
          created_at?: string
          deleted_by?: string
          deleted_user_email?: string | null
          deleted_user_id?: string
          deleted_user_name?: string | null
          id?: string
          reason?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          country: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      details_description: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      discard_quick_reasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      discovered_links: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          is_selected: boolean
          property_id: string | null
          status: string
          task_id: string
          thumbnail_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          is_selected?: boolean
          property_id?: string | null
          status?: string
          task_id: string
          thumbnail_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          is_selected?: boolean
          property_id?: string | null
          status?: string
          task_id?: string
          thumbnail_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "discovered_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_links_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agency_discovery_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      external_agencies: {
        Row: {
          address: string
          created_at: string
          department_id: string | null
          email: string
          id: string
          imported_from: string | null
          is_featured: boolean
          name: string
          phone: string
          website_url: string
        }
        Insert: {
          address?: string
          created_at?: string
          department_id?: string | null
          email?: string
          id?: string
          imported_from?: string | null
          is_featured?: boolean
          name: string
          phone?: string
          website_url?: string
        }
        Update: {
          address?: string
          created_at?: string
          department_id?: string | null
          email?: string
          id?: string
          imported_from?: string | null
          is_featured?: boolean
          name?: string
          phone?: string
          website_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_agencies_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      family_comments: {
        Row: {
          author: string
          avatar: string
          created_at: string
          id: string
          text: string
          user_id: string
          user_listing_id: string
        }
        Insert: {
          author?: string
          avatar?: string
          created_at?: string
          id?: string
          text: string
          user_id: string
          user_listing_id: string
        }
        Update: {
          author?: string
          avatar?: string
          created_at?: string
          id?: string
          text?: string
          user_id?: string
          user_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "family_comments_user_listing_id_fkey"
            columns: ["user_listing_id"]
            isOneToOne: false
            referencedRelation: "user_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_agencies: {
        Row: {
          carousel_row: number
          created_at: string
          id: string
          is_active: boolean
          logo_url: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          carousel_row?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          carousel_row?: number
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      neighborhoods: {
        Row: {
          city_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      org_agency_visits: {
        Row: {
          agency_id: string
          agency_type: string
          created_at: string
          id: string
          org_id: string
          visited_at: string
          visited_by: string
        }
        Insert: {
          agency_id: string
          agency_type: string
          created_at?: string
          id?: string
          org_id: string
          visited_at?: string
          visited_by: string
        }
        Update: {
          agency_id?: string
          agency_type?: string
          created_at?: string
          id?: string
          org_id?: string
          visited_at?: string
          visited_by?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_system_delegate: boolean
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system_delegate?: boolean
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system_delegate?: boolean
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organizations: {
        Row: {
          contact_email: string
          contact_name: string
          contact_person_phone: string
          contact_phone: string
          created_at: string
          created_by: string
          description: string
          id: string
          invite_code: string
          is_personal: boolean
          logo_url: string
          name: string
          parent_id: string | null
          plan_type: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          website_url: string | null
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
          invite_code?: string
          is_personal?: boolean
          logo_url?: string
          name: string
          parent_id?: string | null
          plan_type?: string
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website_url?: string | null
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
          invite_code?: string
          is_personal?: boolean
          logo_url?: string
          name?: string
          parent_id?: string | null
          plan_type?: string
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_leads: {
        Row: {
          created_at: string
          id: string
          partner_id: string
          status: string
          user_id: string
          user_listing_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id: string
          status?: string
          user_id: string
          user_listing_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string
          status?: string
          user_id?: string
          user_listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_leads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_leads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_leads_user_listing_id_fkey"
            columns: ["user_listing_id"]
            isOneToOne: false
            referencedRelation: "user_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean
          contact_info: Json
          created_at: string
          id: string
          name: string
          type: string
        }
        Insert: {
          active?: boolean
          contact_info?: Json
          created_at?: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          active?: boolean
          contact_info?: Json
          created_at?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          avatar_url: string
          created_at: string
          display_name: string
          email: string | null
          id: string
          phone: string
          plan_type: string | null
          referred_by_id: string | null
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          avatar_url?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          phone?: string
          plan_type?: string | null
          referred_by_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          avatar_url?: string
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          phone?: string
          plan_type?: string | null
          referred_by_id?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_id_fkey"
            columns: ["referred_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          city: string
          city_id: string | null
          created_at: string
          created_by: string
          currency: Database["public"]["Enums"]["currency_code"]
          department: string
          department_id: string | null
          details: string
          id: string
          images: string[]
          is_opportunity: boolean
          lat: number | null
          lng: number | null
          m2_total: number
          neighborhood: string
          neighborhood_id: string | null
          price_amount: number
          price_expenses: number
          raw_ai_data: Json | null
          ref: string
          rooms: number
          source_url: string | null
          title: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          address?: string
          city?: string
          city_id?: string | null
          created_at?: string
          created_by: string
          currency?: Database["public"]["Enums"]["currency_code"]
          department?: string
          department_id?: string | null
          details?: string
          id?: string
          images?: string[]
          is_opportunity?: boolean
          lat?: number | null
          lng?: number | null
          m2_total?: number
          neighborhood?: string
          neighborhood_id?: string | null
          price_amount?: number
          price_expenses?: number
          raw_ai_data?: Json | null
          ref?: string
          rooms?: number
          source_url?: string | null
          title: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          city_id?: string | null
          created_at?: string
          created_by?: string
          currency?: Database["public"]["Enums"]["currency_code"]
          department?: string
          department_id?: string | null
          details?: string
          id?: string
          images?: string[]
          is_opportunity?: boolean
          lat?: number | null
          lng?: number | null
          m2_total?: number
          neighborhood?: string
          neighborhood_id?: string | null
          price_amount?: number
          price_expenses?: number
          raw_ai_data?: Json | null
          ref?: string
          rooms?: number
          source_url?: string | null
          title?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "properties_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          created_at: string
          id: string
          org_id: string
          property_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          property_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          property_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      property_views_log: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_views_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_deletion_audit_log: {
        Row: {
          created_at: string
          deleted_by: string
          deleted_by_name: string | null
          id: string
          org_name: string | null
          property_title: string | null
          pub_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          deleted_by: string
          deleted_by_name?: string | null
          id?: string
          org_name?: string | null
          property_title?: string | null
          pub_id: string
          reason?: string
        }
        Update: {
          created_at?: string
          deleted_by?: string
          deleted_by_name?: string | null
          id?: string
          org_name?: string | null
          property_title?: string | null
          pub_id?: string
          reason?: string
        }
        Relationships: []
      }
      scrape_usage_log: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          role: string
          scraper: string
          source_url: string | null
          success: boolean
          token_charged: boolean
          user_id: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          role?: string
          scraper: string
          source_url?: string | null
          success?: boolean
          token_charged?: boolean
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          role?: string
          scraper?: string
          source_url?: string | null
          success?: boolean
          token_charged?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrape_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      scraping_domain_profiles: {
        Row: {
          created_at: string | null
          custom_instructions: string | null
          discovery_config: Json | null
          domain: string
          extraction_config: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_instructions?: string | null
          discovery_config?: Json | null
          domain: string
          extraction_config?: Json | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_instructions?: string | null
          discovery_config?: Json | null
          domain?: string
          extraction_config?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      status_feedback_configs: {
        Row: {
          created_at: string | null
          field_id: string
          field_label: string
          field_type: Database["public"]["Enums"]["feedback_field_type"]
          id: string
          is_active: boolean | null
          is_required: boolean | null
          placeholder: string | null
          sort_order: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          field_label: string
          field_type?: Database["public"]["Enums"]["feedback_field_type"]
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          placeholder?: string | null
          sort_order?: number | null
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          field_label?: string
          field_type?: Database["public"]["Enums"]["feedback_field_type"]
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          placeholder?: string | null
          sort_order?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      status_history_log: {
        Row: {
          changed_by: string
          created_at: string
          event_metadata: Json
          id: string
          new_status: Database["public"]["Enums"]["user_listing_status"]
          old_status: Database["public"]["Enums"]["user_listing_status"] | null
          user_listing_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          event_metadata?: Json
          id?: string
          new_status: Database["public"]["Enums"]["user_listing_status"]
          old_status?: Database["public"]["Enums"]["user_listing_status"] | null
          user_listing_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          event_metadata?: Json
          id?: string
          new_status?: Database["public"]["Enums"]["user_listing_status"]
          old_status?: Database["public"]["Enums"]["user_listing_status"] | null
          user_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_history_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "status_history_log_user_listing_id_fkey"
            columns: ["user_listing_id"]
            isOneToOne: false
            referencedRelation: "user_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          mp_preapproval_id: string | null
          plan_interval: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          mp_preapproval_id?: string | null
          plan_interval?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          mp_preapproval_id?: string | null
          plan_interval?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
        }
        Relationships: []
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
      system_metrics_history: {
        Row: {
          auth_requests: number | null
          disk_io_budget: number | null
          id: string
          realtime_requests: number | null
          recorded_at: string
          rest_requests: number | null
          storage_requests: number | null
        }
        Insert: {
          auth_requests?: number | null
          disk_io_budget?: number | null
          id?: string
          realtime_requests?: number | null
          recorded_at?: string
          rest_requests?: number | null
          storage_requests?: number | null
        }
        Update: {
          auth_requests?: number | null
          disk_io_budget?: number | null
          id?: string
          realtime_requests?: number | null
          recorded_at?: string
          rest_requests?: number | null
          storage_requests?: number | null
        }
        Relationships: []
      }
      user_agency_favorites: {
        Row: {
          agency_id: string
          agency_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agency_id: string
          agency_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agency_id?: string
          agency_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_listing_attachments: {
        Row: {
          added_by: string
          created_at: string
          id: string
          image_url: string
          user_listing_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          image_url: string
          user_listing_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          image_url?: string
          user_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_listing_attachments_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_listing_attachments_user_listing_id_fkey"
            columns: ["user_listing_id"]
            isOneToOne: false
            referencedRelation: "user_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_listing_comment_reads: {
        Row: {
          id: string
          last_read_at: string
          user_id: string
          user_listing_id: string
        }
        Insert: {
          id?: string
          last_read_at?: string
          user_id: string
          user_listing_id: string
        }
        Update: {
          id?: string
          last_read_at?: string
          user_id?: string
          user_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_listing_comment_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_listing_comment_reads_user_listing_id_fkey"
            columns: ["user_listing_id"]
            isOneToOne: false
            referencedRelation: "user_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_listings: {
        Row: {
          added_by: string
          admin_hidden: boolean
          contact_name: string | null
          contact_phone: string | null
          contact_source: string | null
          created_at: string
          current_status: Database["public"]["Enums"]["user_listing_status"]
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          org_id: string
          property_id: string
          quick_note: string
          quick_note_at: string | null
          quick_note_by: string | null
          source_publication_id: string | null
          updated_at: string
        }
        Insert: {
          added_by: string
          admin_hidden?: boolean
          contact_name?: string | null
          contact_phone?: string | null
          contact_source?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["user_listing_status"]
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          org_id: string
          property_id: string
          quick_note?: string
          quick_note_at?: string | null
          quick_note_by?: string | null
          source_publication_id?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string
          admin_hidden?: boolean
          contact_name?: string | null
          contact_phone?: string | null
          contact_source?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["user_listing_status"]
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          org_id?: string
          property_id?: string
          quick_note?: string
          quick_note_at?: string | null
          quick_note_by?: string | null
          source_publication_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_listings_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_listings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_listings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_listings_source_publication_id_fkey"
            columns: ["source_publication_id"]
            isOneToOne: false
            referencedRelation: "agent_deserter_insights"
            referencedColumns: ["publication_id"]
          },
          {
            foreignKeyName: "user_listings_source_publication_id_fkey"
            columns: ["source_publication_id"]
            isOneToOne: false
            referencedRelation: "agent_publications"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_search_profiles: {
        Row: {
          city_id: string | null
          created_at: string
          currency: string
          department_id: string | null
          id: string
          is_private: boolean | null
          max_budget: number | null
          min_bedrooms: number | null
          min_budget: number | null
          neighborhood_ids: string[] | null
          operation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city_id?: string | null
          created_at?: string
          currency?: string
          department_id?: string | null
          id?: string
          is_private?: boolean | null
          max_budget?: number | null
          min_bedrooms?: number | null
          min_budget?: number | null
          neighborhood_ids?: string[] | null
          operation?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city_id?: string | null
          created_at?: string
          currency?: string
          department_id?: string | null
          id?: string
          is_private?: boolean | null
          max_budget?: number | null
          min_bedrooms?: number | null
          min_budget?: number | null
          neighborhood_ids?: string[] | null
          operation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_search_profiles_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_search_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_scrape_usage_by_user: {
        Row: {
          last_scrape_at: string | null
          total_failed: number | null
          total_image_scrapes: number | null
          total_scrapes: number | null
          total_success: number | null
          total_token_charged: number | null
          total_url_scrapes: number | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scrape_usage_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agent_deserter_insights: {
        Row: {
          agency_org_id: string | null
          discard_count: number | null
          event_metadata: Json | null
          new_status: Database["public"]["Enums"]["user_listing_status"] | null
          publication_id: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_publications_org_id_fkey"
            columns: ["agency_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      family_private_rating: {
        Row: {
          avg_rating: number | null
          org_id: string | null
          property_id: string | null
          total_votes: number | null
          votes_detail: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      public_global_rating: {
        Row: {
          avg_rating: number | null
          property_id: string | null
          total_votes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_physical_delete_user: {
        Args: { _deleted_by: string; _reason: string; _user_id: string }
        Returns: undefined
      }
      admin_update_profile_status: {
        Args: {
          _status: Database["public"]["Enums"]["user_status"]
          _user_id: string
        }
        Returns: undefined
      }
      count_profiles_referred_by: {
        Args: { _referrer_user_id: string }
        Returns: number
      }
      count_property_listing_users: {
        Args: { _property_id: string }
        Returns: number
      }
      find_org_by_invite_code: {
        Args: { _code: string }
        Returns: {
          description: string
          id: string
          name: string
          type: Database["public"]["Enums"]["org_type"]
        }[]
      }
      get_agent_property_insights: {
        Args: { p_limit?: number; p_offset?: number; p_org_id: string }
        Returns: {
          current_status: string
          listing_type: string
          property_currency: string
          property_id: string
          property_neighborhood: string
          property_price: number
          property_ref: string
          property_rooms: number
          property_title: string
          pub_created_at: string
          pub_status: string
          publication_id: string
          ratings_by_status: Json
          status_counts: Json
          user_display_name: string
          user_email: string
          user_id: string
          user_listing_id: string
          user_org_id: string
          user_phone: string
          user_updated_at: string
        }[]
      }
      get_all_announcements: {
        Args: never
        Returns: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          image_url: string
          is_active: boolean
          priority: Database["public"]["Enums"]["announcement_priority"]
          reads_count: number
          target_user_id: string
          title: string
        }[]
      }
      get_global_property_ratings: {
        Args: { _property_ids: string[] }
        Returns: {
          avg_rating: number
          property_id: string
          total_votes: number
        }[]
      }
      get_marketplace_org_names: {
        Args: { _org_ids: string[] }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_marketplace_publication_contacts: {
        Args: { _publication_ids: string[] }
        Returns: {
          agent_name: string
          agent_phone: string
          publication_id: string
        }[]
      }
      get_marketplace_publications_page: {
        Args: { _cursor?: string; _filters?: Json; _page_size?: number }
        Returns: Json
      }
      get_my_referrer_display_name: { Args: never; Returns: string }
      get_my_referrer_full_info: { Args: never; Returns: Json }
      get_pending_announcements: {
        Args: { p_user_id: string; p_user_roles: string[] }
        Returns: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          image_url: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          title: string
        }[]
      }
      get_publications_save_counts: {
        Args: { _publication_ids: string[] }
        Returns: {
          publication_id: string
          save_count: number
        }[]
      }
      get_search_profile_contacts: {
        Args: { _user_ids: string[] }
        Returns: {
          display_name: string
          phone: string
          user_id: string
        }[]
      }
      get_status_feedback_config: {
        Args: { p_status: string }
        Returns: {
          field_id: string
          field_label: string
          field_type: Database["public"]["Enums"]["feedback_field_type"]
          id: string
          is_required: boolean
          placeholder: string
          sort_order: number
        }[]
      }
      get_user_announcement_history: {
        Args: { p_user_id: string }
        Returns: {
          audience: Database["public"]["Enums"]["announcement_audience"]
          body: string
          created_at: string
          dismissed_at: string
          id: string
          image_url: string
          priority: Database["public"]["Enums"]["announcement_priority"]
          title: string
        }[]
      }
      get_user_listings_page: {
        Args: { _cursor?: string; _page_size?: number }
        Returns: Json
      }
      get_user_status_history: {
        Args: { p_user_listing_id: string }
        Returns: {
          changed_by: string
          created_at: string
          event_metadata: Json
          new_status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_property_views:
        | {
            Args: { p_is_publication?: boolean; p_property_id: string }
            Returns: undefined
          }
        | {
            Args: { p_property_id: string; p_publication_id?: string }
            Returns: undefined
          }
      is_admin_or_sysadmin: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_agent_referrer: { Args: { _user_id: string }; Returns: boolean }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_system_delegate: { Args: { _user_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_organization_logo_url: {
        Args: { _logo_url: string; _org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      agent_pub_status:
        | "disponible"
        | "reservado"
        | "vendido"
        | "alquilado"
        | "eliminado"
        | "pausado"
      analytics_event_type: "qr_scan" | "property_view" | "listing_saved"
      announcement_audience: "all" | "agents" | "users" | "specific"
      announcement_priority: "normal" | "urgent"
      app_role: "admin" | "agency" | "user" | "agencymember" | "sysadmin"
      currency_code: "USD" | "ARS" | "UYU" | "CLP" | "UI"
      feedback_field_type: "rating" | "boolean" | "text" | "date" | "info"
      listing_type: "rent" | "sale"
      org_role: "owner" | "agent" | "member" | "system_admin_delegate"
      org_type: "family" | "agency_team" | "sub_team"
      user_listing_status:
        | "ingresado"
        | "contactado"
        | "visita_coordinada"
        | "visitado"
        | "a_analizar"
        | "descartado"
        | "firme_candidato"
        | "posible_interes"
        | "meta_conseguida"
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
      agent_pub_status: [
        "disponible",
        "reservado",
        "vendido",
        "alquilado",
        "eliminado",
        "pausado",
      ],
      analytics_event_type: ["qr_scan", "property_view", "listing_saved"],
      announcement_audience: ["all", "agents", "users", "specific"],
      announcement_priority: ["normal", "urgent"],
      app_role: ["admin", "agency", "user", "agencymember", "sysadmin"],
      currency_code: ["USD", "ARS", "UYU", "CLP", "UI"],
      feedback_field_type: ["rating", "boolean", "text", "date", "info"],
      listing_type: ["rent", "sale"],
      org_role: ["owner", "agent", "member", "system_admin_delegate"],
      org_type: ["family", "agency_team", "sub_team"],
      user_listing_status: [
        "ingresado",
        "contactado",
        "visita_coordinada",
        "visitado",
        "a_analizar",
        "descartado",
        "firme_candidato",
        "posible_interes",
        "meta_conseguida",
      ],
      user_status: ["active", "pending", "suspended", "rejected"],
    },
  },
} as const
