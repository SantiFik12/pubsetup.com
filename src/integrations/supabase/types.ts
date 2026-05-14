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
      app_settings: {
        Row: {
          id: boolean
          paddle_mode: string
          paddle_token_live: string
          paddle_token_sandbox: string
          updated_at: string
        }
        Insert: {
          id?: boolean
          paddle_mode?: string
          paddle_token_live?: string
          paddle_token_sandbox?: string
          updated_at?: string
        }
        Update: {
          id?: boolean
          paddle_mode?: string
          paddle_token_live?: string
          paddle_token_sandbox?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: Json
          cover: string
          created_at: string
          date: string
          excerpt: string
          id: string
          published: boolean
          read_minutes: number
          slug: string
          tags: string[]
          title: string
          toc: Json
          updated_at: string
        }
        Insert: {
          author?: string
          category?: string
          content?: Json
          cover?: string
          created_at?: string
          date?: string
          excerpt?: string
          id?: string
          published?: boolean
          read_minutes?: number
          slug: string
          tags?: string[]
          title: string
          toc?: Json
          updated_at?: string
        }
        Update: {
          author?: string
          category?: string
          content?: Json
          cover?: string
          created_at?: string
          date?: string
          excerpt?: string
          id?: string
          published?: boolean
          read_minutes?: number
          slug?: string
          tags?: string[]
          title?: string
          toc?: Json
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          ip: string | null
          message: string
          name: string
          status: string
          subject: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip?: string | null
          message: string
          name: string
          status?: string
          subject?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip?: string | null
          message?: string
          name?: string
          status?: string
          subject?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      extensions: {
        Row: {
          affiliate_url: string
          best_seller: boolean
          category_id: string
          cover_image: string
          created_at: string
          description: string
          edition: Database["public"]["Enums"]["magento_edition"]
          features: string[]
          gallery: Json
          has_demo: boolean
          has_trial: boolean
          hyva_compatible: boolean
          id: string
          install_complexity: Database["public"]["Enums"]["install_complexity"]
          install_price: number
          magento_versions: string[]
          name: string
          partner_id: string
          price_from: number
          price_type: Database["public"]["Enums"]["price_type"]
          pwa_ready: boolean
          rating: number
          recommended: boolean
          reviews: number
          short_description: string
          slug: string
          support_months: number
          tags: string[]
          updated_at: string
          use_cases: string[]
          user_guide_url: string
        }
        Insert: {
          affiliate_url?: string
          best_seller?: boolean
          category_id: string
          cover_image?: string
          created_at?: string
          description?: string
          edition?: Database["public"]["Enums"]["magento_edition"]
          features?: string[]
          gallery?: Json
          has_demo?: boolean
          has_trial?: boolean
          hyva_compatible?: boolean
          id?: string
          install_complexity?: Database["public"]["Enums"]["install_complexity"]
          install_price?: number
          magento_versions?: string[]
          name: string
          partner_id: string
          price_from?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          pwa_ready?: boolean
          rating?: number
          recommended?: boolean
          reviews?: number
          short_description?: string
          slug: string
          support_months?: number
          tags?: string[]
          updated_at?: string
          use_cases?: string[]
          user_guide_url?: string
        }
        Update: {
          affiliate_url?: string
          best_seller?: boolean
          category_id?: string
          cover_image?: string
          created_at?: string
          description?: string
          edition?: Database["public"]["Enums"]["magento_edition"]
          features?: string[]
          gallery?: Json
          has_demo?: boolean
          has_trial?: boolean
          hyva_compatible?: boolean
          id?: string
          install_complexity?: Database["public"]["Enums"]["install_complexity"]
          install_price?: number
          magento_versions?: string[]
          name?: string
          partner_id?: string
          price_from?: number
          price_type?: Database["public"]["Enums"]["price_type"]
          pwa_ready?: boolean
          rating?: number
          recommended?: boolean
          reviews?: number
          short_description?: string
          slug?: string
          support_months?: number
          tags?: string[]
          updated_at?: string
          use_cases?: string[]
          user_guide_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "extensions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extensions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          email: string
          extension_id: string | null
          id: string
          notes: string | null
          order_code: string
          service_id: string
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          customer_name: string
          email: string
          extension_id?: string | null
          id?: string
          notes?: string | null
          order_code?: string
          service_id: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          email?: string
          extension_id?: string | null
          id?: string
          notes?: string | null
          order_code?: string
          service_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_extension_id_fkey"
            columns: ["extension_id"]
            isOneToOne: false
            referencedRelation: "extensions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          description: string
          id: string
          logo_letter: string
          name: string
          slug: string
          updated_at: string
          website: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          logo_letter: string
          name: string
          slug: string
          updated_at?: string
          website?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          logo_letter?: string
          name?: string
          slug?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      seo_landings: {
        Row: {
          created_at: string
          filter: Json
          id: string
          intro: string
          meta_description: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          filter?: Json
          id?: string
          intro?: string
          meta_description?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          filter?: Json
          id?: string
          intro?: string
          meta_description?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          duration: string
          featured: boolean
          id: string
          includes: string[]
          name: string
          position: number
          price: number
          slug: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration?: string
          featured?: boolean
          id?: string
          includes?: string[]
          name: string
          position?: number
          price?: number
          slug: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration?: string
          featured?: boolean
          id?: string
          includes?: string[]
          name?: string
          position?: number
          price?: number
          slug?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor"
      install_complexity: "simple" | "complex"
      magento_edition: "open-source" | "commerce" | "both"
      order_status:
        | "pending"
        | "paid"
        | "in_progress"
        | "completed"
        | "cancelled"
      price_type: "one-time" | "subscription" | "free"
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
      app_role: ["admin", "editor"],
      install_complexity: ["simple", "complex"],
      magento_edition: ["open-source", "commerce", "both"],
      order_status: [
        "pending",
        "paid",
        "in_progress",
        "completed",
        "cancelled",
      ],
      price_type: ["one-time", "subscription", "free"],
    },
  },
} as const
