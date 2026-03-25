import type { Database } from './database'
import type { ClientSignal } from './signal'

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

// Client locale
export type ClientLocale = 'local' | 'foreign'

export const LOCALE_LABELS: Record<ClientLocale, string> = {
  local: 'Local',
  foreign: 'Foreign',
}

// First impact — how the client entered the brand
export type FirstImpact = 'flash_entry' | 'strong_entry' | 'progressive' | 'unknown'

export const FIRST_IMPACT_CONFIG: Record<FirstImpact, { label: string; description: string; color: string }> = {
  flash_entry: { label: 'Flash', description: 'First purchase ≥ 2 500 €', color: '#C34747' },
  strong_entry: { label: 'Strong', description: 'First purchase ≥ 1 000 €', color: '#D97706' },
  progressive: { label: 'Progressive', description: 'Building over time', color: '#2F6B4F' },
  unknown: { label: '—', description: 'No purchase yet', color: '#999' },
}

// Locale-aware recontact multiplier
// Foreign clients get 2x the cadence (e.g., 14 days → 28 days)
export const LOCALE_RECONTACT_MULTIPLIER: Record<ClientLocale, number> = {
  local: 1,
  foreign: 2,
}

// Signal-aware recontact multiplier
// Locked (very_hot) = more frequent, Off (lost) = less frequent
export const SIGNAL_RECONTACT_MULTIPLIER: Record<string, number> = {
  very_hot: 0.5,  // Locked: 2x frequency
  hot: 1.0,       // Strong: normal
  warm: 1.0,      // Open: normal
  cold: 1.5,      // Low: slower
  lost: 3.0,      // Off: much slower
}

// Calculate recontact days from tier + signal + locale
export function getRecontactDays(
  tier: ClientTier,
  signal?: string | null,
  locale?: ClientLocale | null
): number {
  let baseDays = TIER_RECONTACT_DAYS[tier]
  let multiplier = 1.0

  // Apply locale multiplier
  if (locale && LOCALE_RECONTACT_MULTIPLIER[locale]) {
    multiplier *= LOCALE_RECONTACT_MULTIPLIER[locale]
  }

  // Apply signal multiplier
  if (signal && SIGNAL_RECONTACT_MULTIPLIER[signal]) {
    multiplier *= SIGNAL_RECONTACT_MULTIPLIER[signal]
  }

  // Minimum 3 days
  return Math.max(3, Math.round(baseDays * multiplier))
}

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

export type NotificationType = Database['public']['Enums']['notification_type']
export type NotificationRow = Database['public']['Tables']['notifications']['Row']

export type ClientOrigin = Database['public']['Enums']['client_origin']
export type ConversionSource = Database['public']['Enums']['conversion_source']

export type ClientSizing = Database['public']['Tables']['client_sizing']['Row']
export type ClientSizingInsert = Database['public']['Tables']['client_sizing']['Insert']
export type ClientSizingUpdate = Database['public']['Tables']['client_sizing']['Update']

export type Visit = Database['public']['Tables']['visits']['Row']
export type VisitInsert = Database['public']['Tables']['visits']['Insert']
export type VisitUpdate = Database['public']['Tables']['visits']['Update']

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
  origin: ClientOrigin | null
  is_personal_shopper: boolean
  heat_score: number
  seller_signal: ClientSignal | null
  signal_note: string | null
  signal_updated_at: string | null
  life_notes: string | null
  locale: ClientLocale
  first_impact: FirstImpact
  created_at: string
  updated_at: string
  seller_name: string
  interests: InterestItem[] | null
  contact_history: ContactHistoryItem[] | null
  purchase_history: PurchaseHistoryItem[] | null
  sizing: SizingItem[] | null
  known_sizes: KnownSizeItem[] | null
  visit_history: VisitItem[] | null
}

export interface SizingItem {
  id: string
  category: string
  size: string
  fit_preference: string | null
  notes: string | null
}

export interface VisitItem {
  id: string
  date: string
  duration_minutes: number | null
  tried_products: string[] | null
  notes: string | null
  converted: boolean
}

export interface InterestItem {
  id: string
  category: string
  value: string
  detail: string | null
  domain: 'fashion' | 'life'
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
  product_name: string | null
  product_category: string | null
  size: string | null
  size_type: string | null
  is_gift: boolean
  gift_recipient: string | null
  source: PurchaseSource | null
}

export interface KnownSizeItem {
  client_id: string
  category: string
  size: string
  size_type: string | null
  last_product: string | null
  last_purchase_date: string | null
}

export const PRODUCT_CATEGORIES = [
  { value: 'jacket', label: 'Jacket / Outerwear' },
  { value: 'trousers', label: 'Trousers / Pants' },
  { value: 'shirt', label: 'Shirt / Top' },
  { value: 'knitwear', label: 'Knitwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'other', label: 'Other' },
] as const

export type ProductCategory = typeof PRODUCT_CATEGORIES[number]['value']

// Purchase source attribution - how the sale happened
export const PURCHASE_SOURCES = [
  { value: 'casa_one', label: 'Casa One recontact', description: 'Client came back after CRM outreach' },
  { value: 'walk_in', label: 'Walk-in', description: 'Client came in on their own' },
  { value: 'event', label: 'Event', description: 'Sale during an event or trunk show' },
  { value: 'instagram', label: 'Instagram', description: 'Client reached out via Instagram' },
  { value: 'recommendation', label: 'Recommendation', description: 'Referred by another client' },
  { value: 'existing_client', label: 'Returning client', description: 'Regular who came back independently' },
  { value: 'other', label: 'Other', description: '' },
] as const

export type PurchaseSource = typeof PURCHASE_SOURCES[number]['value']

// Source badge colors for display
export const PURCHASE_SOURCE_COLORS: Record<PurchaseSource, { bg: string; text: string }> = {
  casa_one: { bg: 'bg-[#003D2B]/10', text: 'text-[#003D2B]' },
  walk_in: { bg: 'bg-gray-100', text: 'text-gray-600' },
  event: { bg: 'bg-purple-50', text: 'text-purple-700' },
  instagram: { bg: 'bg-pink-50', text: 'text-pink-700' },
  recommendation: { bg: 'bg-amber-50', text: 'text-amber-700' },
  existing_client: { bg: 'bg-blue-50', text: 'text-blue-700' },
  other: { bg: 'bg-gray-50', text: 'text-gray-500' },
}

// Get source label for display
export function getPurchaseSourceLabel(source: PurchaseSource | string | null): string {
  const found = PURCHASE_SOURCES.find(s => s.value === source)
  return found?.label || 'Unknown'
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
  effectiveRole: UserRole
}

// Meeting types - re-export from meetings.ts
export * from './meetings'

// Signal types - re-export from signal.ts
export * from './signal'

// Recontact cadence - re-export from recontact.ts
export * from './recontact'
