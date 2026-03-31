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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'seller' | 'supervisor'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'seller' | 'supervisor'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'seller' | 'supervisor'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          seller_id: string
          tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
          total_spend: number
          first_contact_date: string | null
          last_contact_date: string | null
          next_recontact_date: string | null
          notes: string | null
          origin: 'french' | 'foreign' | null
          is_personal_shopper: boolean
          heat_score: number
          heat_updated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          seller_id: string
          tier?: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
          total_spend?: number
          first_contact_date?: string | null
          last_contact_date?: string | null
          next_recontact_date?: string | null
          notes?: string | null
          origin?: 'french' | 'foreign' | null
          is_personal_shopper?: boolean
          heat_score?: number
          heat_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          seller_id?: string
          tier?: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
          total_spend?: number
          first_contact_date?: string | null
          last_contact_date?: string | null
          next_recontact_date?: string | null
          notes?: string | null
          origin?: 'french' | 'foreign' | null
          is_personal_shopper?: boolean
          heat_score?: number
          heat_updated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      client_interests: {
        Row: {
          id: string
          client_id: string
          category: string
          value: string
          detail: string | null
          domain: string
          is_deleted: boolean
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          category: string
          value: string
          detail?: string | null
          domain?: string
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          category?: string
          value?: string
          detail?: string | null
          domain?: string
          is_deleted?: boolean
          deleted_at?: string | null
          created_at?: string
        }
      }
      client_brand_affinity: {
        Row: {
          id: string
          client_id: string
          familiarity: string | null
          sensitivity: string | null
          purchase_behavior: string | null
          contact_preference: string | null
          channel: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          familiarity?: string | null
          sensitivity?: string | null
          purchase_behavior?: string | null
          contact_preference?: string | null
          channel?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          familiarity?: string | null
          sensitivity?: string | null
          purchase_behavior?: string | null
          contact_preference?: string | null
          channel?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          client_id: string
          seller_id: string
          channel: 'whatsapp' | 'sms' | 'phone' | 'email' | 'in_store' | 'other'
          contact_date: string
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          seller_id: string
          channel: 'whatsapp' | 'sms' | 'phone' | 'email' | 'in_store' | 'other'
          contact_date?: string
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          seller_id?: string
          channel?: 'whatsapp' | 'sms' | 'phone' | 'email' | 'in_store' | 'other'
          contact_date?: string
          comment?: string | null
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          client_id: string
          seller_id: string
          amount: number
          description: string | null
          purchase_date: string
          conversion_source: 'organic' | 'recontact' | 'campaign' | 'referral'
          source_contact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          seller_id: string
          amount: number
          description?: string | null
          purchase_date?: string
          conversion_source?: 'organic' | 'recontact' | 'campaign' | 'referral'
          source_contact_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          seller_id?: string
          amount?: number
          description?: string | null
          purchase_date?: string
          conversion_source?: 'organic' | 'recontact' | 'campaign' | 'referral'
          source_contact_id?: string | null
          created_at?: string
        }
      }
      client_sizing: {
        Row: {
          id: string
          client_id: string
          category: string
          size: string
          fit_preference: string | null
          notes: string | null
          size_system: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          category: string
          size: string
          fit_preference?: string | null
          notes?: string | null
          size_system?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          category?: string
          size?: string
          fit_preference?: string | null
          notes?: string | null
          size_system?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      visits: {
        Row: {
          id: string
          client_id: string
          seller_id: string
          visit_date: string
          duration_minutes: number | null
          tried_products: string[] | null
          notes: string | null
          converted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          seller_id: string
          visit_date?: string
          duration_minutes?: number | null
          tried_products?: string[] | null
          notes?: string | null
          converted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          seller_id?: string
          visit_date?: string
          duration_minutes?: number | null
          tried_products?: string[] | null
          notes?: string | null
          converted?: boolean
          created_at?: string
        }
      }
      interest_taxonomy: {
        Row: {
          id: string
          category: string
          value: string
          display_label: string
          sort_order: number
        }
        Insert: {
          id?: string
          category: string
          value: string
          display_label: string
          sort_order?: number
        }
        Update: {
          id?: string
          category?: string
          value?: string
          display_label?: string
          sort_order?: number
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: Database['public']['Enums']['notification_type']
          title: string
          message: string | null
          client_id: string | null
          read: boolean
          due_at: string
          event_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: Database['public']['Enums']['notification_type']
          title: string
          message?: string | null
          client_id?: string | null
          read?: boolean
          due_at?: string
          event_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database['public']['Enums']['notification_type']
          title?: string
          message?: string | null
          client_id?: string | null
          read?: boolean
          due_at?: string
          event_key?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      recontact_queue: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string | null
          email: string | null
          tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
          total_spend: number
          last_contact_date: string | null
          next_recontact_date: string | null
          origin: 'french' | 'foreign' | null
          is_personal_shopper: boolean
          heat_score: number
          days_overdue: number
          seller_id: string
          seller_name: string
        }
      }
      client_360: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          seller_id: string
          tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
          total_spend: number
          first_contact_date: string | null
          last_contact_date: string | null
          next_recontact_date: string | null
          notes: string | null
          origin: 'french' | 'foreign' | null
          is_personal_shopper: boolean
          heat_score: number
          created_at: string
          updated_at: string
          seller_name: string
          interests: Json | null
          contact_history: Json | null
          purchase_history: Json | null
          sizing: Json | null
          visit_history: Json | null
        }
      }
    }
    Enums: {
      user_role: 'seller' | 'supervisor'
      contact_channel: 'whatsapp' | 'sms' | 'phone' | 'email' | 'in_store' | 'other'
      client_tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
      client_origin: 'french' | 'foreign'
      conversion_source: 'organic' | 'recontact' | 'campaign' | 'referral'
      notification_type:
        | 'client_overdue'
        | 'tier_upgrade'
        | 'big_purchase'
        | 'seller_inactive'
        | 'new_client_assigned'
        | 'manual'
        | 'visit_thank_you'
        | 'purchase_thank_you'
        | 'purchase_check_in'
    }
  }
}
