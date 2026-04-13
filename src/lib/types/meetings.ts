/**
 * Meeting Types for Casa One Calendar System
 */

// Meeting format enum - where the meeting takes place
export type MeetingFormat = 'boutique' | 'external' | 'call' | 'video' | 'whatsapp'

// Meeting status enum
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

// Default boutique location
export const DEFAULT_BOUTIQUE_LOCATION = 'Maison Serein Paris - Avenue Montaigne'

// Format display configuration (icons are SVG paths rendered in components)
export const MEETING_FORMAT_CONFIG: Record<MeetingFormat, {
  label: string
  iconType: 'store' | 'pin' | 'phone' | 'video' | 'message'
  bgColor: string
  textColor: string
}> = {
  boutique: {
    label: 'In Store',
    iconType: 'store',
    bgColor: 'bg-[#003D2B]/10',
    textColor: 'text-[#003D2B]',
  },
  external: {
    label: 'External',
    iconType: 'pin',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  call: {
    label: 'Call',
    iconType: 'phone',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
  },
  video: {
    label: 'Video',
    iconType: 'video',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
  whatsapp: {
    label: 'WhatsApp',
    iconType: 'message',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
  },
}

// Status display configuration
export const MEETING_STATUS_CONFIG: Record<MeetingStatus, {
  label: string
  dotColor: string
}> = {
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-green-500',
  },
  completed: {
    label: 'Completed',
    dotColor: 'bg-gray-400',
  },
  cancelled: {
    label: 'Cancelled',
    dotColor: 'bg-[#003D2B]/40',
  },
  no_show: {
    label: 'No Show',
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
  client_phone: string | null
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

export interface MeetingBuckets {
  today: MeetingWithDetails[]
  tomorrow: MeetingWithDetails[]
  laterThisWeek: MeetingWithDetails[]
  missed: MeetingWithDetails[]
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
  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${formatTime(start)} â€“ ${formatTime(end)}`
}

export function formatMeetingOwnerLine(
  meeting: Pick<MeetingWithDetails, 'seller_name' | 'format'>
): string {
  return [meeting.seller_name, MEETING_FORMAT_CONFIG[meeting.format].label].join(' Â· ')
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

function startOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function endOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(23, 59, 59, 999)
  return value
}

function addDays(date: Date, days: number): Date {
  const value = new Date(date)
  value.setDate(value.getDate() + days)
  return value
}

function sortMeetingsByStartTime(meetings: MeetingWithDetails[], direction: 'asc' | 'desc' = 'asc'): MeetingWithDetails[] {
  return [...meetings].sort((a, b) => {
    const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    return direction === 'asc' ? diff : -diff
  })
}

export function groupMeetingsForSurface(
  meetings: MeetingWithDetails[],
  referenceDate: Date = new Date()
): MeetingBuckets {
  const todayStart = startOfDay(referenceDate)
  const todayEnd = endOfDay(referenceDate)
  const tomorrowStart = startOfDay(addDays(referenceDate, 1))
  const tomorrowEnd = endOfDay(addDays(referenceDate, 1))
  const weekEnd = getWeekBounds(referenceDate).end

  const activeMeetings = meetings.filter((meeting) => meeting.status !== 'completed' && meeting.status !== 'cancelled')

  const missed = activeMeetings.filter((meeting) => {
    const meetingStart = new Date(meeting.start_time)
    return meeting.status === 'no_show' || (meeting.status === 'scheduled' && meetingStart < referenceDate)
  })

  const today = activeMeetings.filter((meeting) => {
    if (meeting.status !== 'scheduled') return false
    const meetingStart = new Date(meeting.start_time)
    return meetingStart >= referenceDate && meetingStart <= todayEnd
  })

  const tomorrow = activeMeetings.filter((meeting) => {
    if (meeting.status !== 'scheduled') return false
    const meetingStart = new Date(meeting.start_time)
    return meetingStart >= tomorrowStart && meetingStart <= tomorrowEnd
  })

  const laterThisWeek = activeMeetings.filter((meeting) => {
    if (meeting.status !== 'scheduled') return false
    const meetingStart = new Date(meeting.start_time)
    return meetingStart > tomorrowEnd && meetingStart <= weekEnd
  })

  return {
    today: sortMeetingsByStartTime(today),
    tomorrow: sortMeetingsByStartTime(tomorrow),
    laterThisWeek: sortMeetingsByStartTime(laterThisWeek),
    missed: sortMeetingsByStartTime(missed, 'desc'),
  }
}

// ============================================================================
// Calendar Grid Types
// ============================================================================

// For the grid rendering, parsed to local time
export interface CalendarEvent {
  id: string
  date: string        // YYYY-MM-DD (local)
  startHour: number   // 0-23
  startMinute: number // 0-59
  endHour: number
  endMinute: number
  durationMinutes: number
  title: string
  format: MeetingFormat
  status: MeetingStatus
  clientName: string | null
  sellerId: string
  sellerName: string | null
  // Keep reference to original for editing
  originalMeeting: MeetingWithDetails
}

// Seller colors for supervisor "All sellers" view
export const SELLER_COLORS = [
  { bg: 'bg-[#003D2B]/10', border: 'border-[#003D2B]' },
  { bg: 'bg-blue-50', border: 'border-blue-400' },
  { bg: 'bg-purple-50', border: 'border-purple-400' },
  { bg: 'bg-amber-50', border: 'border-amber-400' },
  { bg: 'bg-rose-50', border: 'border-rose-400' },
  { bg: 'bg-teal-50', border: 'border-teal-400' },
  { bg: 'bg-orange-50', border: 'border-orange-400' },
  { bg: 'bg-sky-50', border: 'border-sky-400' },
] as const

// Format-based border colors for individual seller view
export const FORMAT_BORDER_COLORS: Record<MeetingFormat, string> = {
  boutique: 'border-[#003D2B]',
  external: 'border-blue-400',
  call: 'border-orange-400',
  video: 'border-purple-400',
  whatsapp: 'border-teal-400',
}

// Parse Meeting to CalendarEvent
export function toCalendarEvent(meeting: MeetingWithDetails): CalendarEvent {
  const start = new Date(meeting.start_time)
  const end = new Date(meeting.end_time)

  const endHour = end.getHours()
  let durationMinutes = (end.getTime() - start.getTime()) / 60000

  // If duration is negative or zero, default to minimum
  if (durationMinutes <= 0) {
    durationMinutes = 15
  }

  return {
    id: meeting.id,
    date: start.toISOString().split('T')[0],
    startHour: start.getHours(),
    startMinute: start.getMinutes(),
    endHour,
    endMinute: end.getMinutes(),
    durationMinutes,
    title: meeting.title,
    format: meeting.format,
    status: meeting.status,
    clientName: meeting.client_name || null,
    sellerId: meeting.seller_id,
    sellerName: meeting.seller_name || null,
    originalMeeting: meeting,
  }
}

// Generate time options for dropdown (15-minute increments)
export function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  for (let hour = 8; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      options.push({ value, label: value })
    }
  }
  // Add 00:00 as end time option
  options.push({ value: '00:00', label: '00:00' })
  return options
}


