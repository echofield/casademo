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
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          category: string
          value: string
          detail?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          category?: string
          value?: string
          detail?: string | null
          created_at?: string
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
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          seller_id: string
          amount: number
          description?: string | null
          purchase_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          seller_id?: string
          amount?: number
          description?: string | null
          purchase_date?: string
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
          created_at: string
          updated_at: string
          seller_name: string
          interests: Json | null
          contact_history: Json | null
          purchase_history: Json | null
        }
      }
    }
    Enums: {
      user_role: 'seller' | 'supervisor'
      contact_channel: 'whatsapp' | 'sms' | 'phone' | 'email' | 'in_store' | 'other'
      client_tier: 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
      notification_type:
        | 'client_overdue'
        | 'tier_upgrade'
        | 'big_purchase'
        | 'seller_inactive'
        | 'new_client_assigned'
        | 'manual'
    }
  }
}
