import type { Database } from './database'

// Enums
export type UserRole = Database['public']['Enums']['user_role']
export type ContactChannel = Database['public']['Enums']['contact_channel']
export type ClientTier = Database['public']['Enums']['client_tier']

// Tier configuration
export const TIER_THRESHOLDS: Record<ClientTier, number> = {
  rainbow: 0,
  optimisto: 1000,
  kaizen: 2500,
  idealiste: 10000,
  diplomatico: 17000,
  grand_prix: 25000,
}

export const TIER_RECONTACT_DAYS: Record<ClientTier, number> = {
  rainbow: 60,
  optimisto: 45,
  kaizen: 30,
  idealiste: 21,
  diplomatico: 14,
  grand_prix: 7,
}

export const TIER_LABELS: Record<ClientTier, string> = {
  rainbow: 'Rainbow',
  optimisto: 'Optimisto',
  kaizen: 'Kaizen',
  idealiste: 'Idealiste',
  diplomatico: 'Diplomatico',
  grand_prix: 'Grand Prix',
}

export const TIER_ORDER: ClientTier[] = [
  'rainbow',
  'optimisto',
  'kaizen',
  'idealiste',
  'diplomatico',
  'grand_prix',
]

// Table types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type ClientInterest = Database['public']['Tables']['client_interests']['Row']
export type ClientInterestInsert = Database['public']['Tables']['client_interests']['Insert']

export type Contact = Database['public']['Tables']['contacts']['Row']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']

export type Purchase = Database['public']['Tables']['purchases']['Row']
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert']

export type InterestTaxonomy = Database['public']['Tables']['interest_taxonomy']['Row']

// View types
export type RecontactQueueItem = Database['public']['Views']['recontact_queue']['Row']

// Client 360 with typed arrays
export interface Client360 {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  seller_id: string
  tier: ClientTier
  total_spend: number
  first_contact_date: string | null
  last_contact_date: string | null
  next_recontact_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  seller_name: string
  interests: InterestItem[] | null
  contact_history: ContactHistoryItem[] | null
  purchase_history: PurchaseHistoryItem[] | null
}

export interface InterestItem {
  id: string
  category: string
  value: string
  detail: string | null
}

export interface ContactHistoryItem {
  id: string
  date: string
  channel: ContactChannel
  comment: string | null
  seller: string
}

export interface PurchaseHistoryItem {
  id: string
  date: string
  amount: number
  description: string | null
}

// API types
export interface ClientListParams {
  tier?: ClientTier
  search?: string
  seller_id?: string
  page?: number
  limit?: number
}

export interface ClientListResponse {
  data: Client[]
  count: number
  page: number
  limit: number
}

export interface DashboardMetrics {
  clients_by_tier: Record<ClientTier, number>
  contacts_this_week: number
  overdue_by_seller: Array<{
    seller_id: string
    seller_name: string
    overdue_count: number
  }>
  total_clients: number
  total_overdue: number
}

export interface ImportResult {
  created: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  profile: Profile
}
