/**
 * Meeting Types for Casa One Calendar System
 */

// Meeting format enum - where the meeting takes place
export type MeetingFormat = 'boutique' | 'external' | 'call' | 'video' | 'whatsapp'

// Meeting status enum
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

// Default boutique location
export const DEFAULT_BOUTIQUE_LOCATION = 'Casablanca Paris — Faubourg Saint-Honore'

// Format display configuration
export const MEETING_FORMAT_CONFIG: Record<MeetingFormat, {
  label: string
  labelFr: string
  icon: string
  bgColor: string
  textColor: string
}> = {
  boutique: {
    label: 'In Store',
    labelFr: 'En boutique',
    icon: '🏪',
    bgColor: 'bg-[#003D2B]/10',
    textColor: 'text-[#003D2B]',
  },
  external: {
    label: 'External',
    labelFr: 'Exterieur',
    icon: '📍',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  call: {
    label: 'Call',
    labelFr: 'Appel',
    icon: '📞',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  video: {
    label: 'Video',
    labelFr: 'Video',
    icon: '📹',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  whatsapp: {
    label: 'WhatsApp',
    labelFr: 'WhatsApp',
    icon: '💬',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
}

// Status display configuration
export const MEETING_STATUS_CONFIG: Record<MeetingStatus, {
  label: string
  labelFr: string
  dotColor: string
}> = {
  scheduled: {
    label: 'Scheduled',
    labelFr: 'Prevu',
    dotColor: 'bg-green-500',
  },
  completed: {
    label: 'Completed',
    labelFr: 'Termine',
    dotColor: 'bg-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    labelFr: 'Annule',
    dotColor: 'bg-red-500',
  },
  no_show: {
    label: 'No Show',
    labelFr: 'Absent',
    dotColor: 'bg-amber-500',
  },
}

// Meeting database row type
export interface Meeting {
  id: string
  seller_id: string
  client_id: string | null
  title: string
  description: string | null
  format: MeetingFormat
  location: string | null
  start_time: string
  end_time: string
  all_day: boolean
  status: MeetingStatus
  outcome_notes: string | null
  outcome_purchased: boolean
  created_at: string
  updated_at: string
}

// Meeting with joined data for display
export interface MeetingWithDetails extends Meeting {
  client_name: string | null
  client_tier: string | null
  seller_name: string
}

// Insert type for creating meetings
export interface MeetingInsert {
  seller_id?: string // Auto-filled from auth.uid() if not supervisor
  client_id?: string | null
  title: string
  description?: string | null
  format: MeetingFormat
  location?: string | null
  start_time: string
  end_time: string
  all_day?: boolean
}

// Update type for modifying meetings
export interface MeetingUpdate {
  title?: string
  description?: string | null
  format?: MeetingFormat
  location?: string | null
  start_time?: string
  end_time?: string
  all_day?: boolean
  status?: MeetingStatus
  outcome_notes?: string | null
  outcome_purchased?: boolean
}

// API response types
export interface MeetingsListResponse {
  data: MeetingWithDetails[]
  count: number
}

export interface MeetingResponse {
  data: MeetingWithDetails
}

// Query parameters for listing meetings
export interface MeetingsListParams {
  start?: string // ISO date string
  end?: string // ISO date string
  seller_id?: string // For supervisors to filter by seller
  client_id?: string // Filter by client
  status?: MeetingStatus
}

// Duration presets in minutes
export const DURATION_PRESETS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
] as const

// Helper to get week start/end dates (Europe/Paris timezone)
export function getWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday

  const start = new Date(d)
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

// Helper to format time range
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const formatTime = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${formatTime(start)} – ${formatTime(end)}`
}

// Helper to check if meeting is today
export function isMeetingToday(startTime: string): boolean {
  const meetingDate = new Date(startTime)
  const today = new Date()
  return meetingDate.toDateString() === today.toDateString()
}

// Helper to check if meeting is in the future
export function isMeetingFuture(startTime: string): boolean {
  return new Date(startTime) > new Date()
}
