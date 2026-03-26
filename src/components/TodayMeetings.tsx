'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Plus, Store, MapPin, Phone, Video, MessageCircle } from 'lucide-react'
import {
  MeetingWithDetails,
  MEETING_STATUS_CONFIG,
  formatMeetingOwnerLine,
  formatTimeRange,
} from '@/lib/types/meetings'

const FORMAT_ICONS = {
  store: Store,
  pin: MapPin,
  phone: Phone,
  video: Video,
  message: MessageCircle,
}

export function TodayMeetings() {
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTodayMeetings() {
      try {
        // Get today's meetings
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const res = await fetch(
          `/api/meetings?start=${today.toISOString()}&end=${tomorrow.toISOString()}`
        )
        if (res.ok) {
          const data = await res.json()
          // Filter to only scheduled meetings
          const scheduledMeetings = (data.data || []).filter(
            (m: MeetingWithDetails) => m.status === 'scheduled'
          )
          setMeetings(scheduledMeetings)
        }
      } catch (err) {
        console.error('Error fetching today meetings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayMeetings()
  }, [])

  const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' }

  if (loading) {
    return (
      <section className="mt-6 border bg-surface p-6" style={cardBorder}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">TODAY</span>
        </div>
        <p className="text-text-muted text-sm">Loading...</p>
      </section>
    )
  }

  return (
    <section className="mt-6 border bg-surface p-6" style={cardBorder}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">TODAY</span>
        </div>
        <Link
          href="/calendar"
          className="text-xs text-primary hover:text-primary-soft uppercase tracking-wide"
        >
          Calendar →
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-text-muted text-sm mb-3">No meetings today</p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule a meeting
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(meeting => {
            const statusConfig = MEETING_STATUS_CONFIG[meeting.status]
            const timeRange = formatTimeRange(meeting.start_time, meeting.end_time)
            const primaryLine = `${timeRange} — ${meeting.client_name || meeting.title}`
            const secondaryLine = formatMeetingOwnerLine(meeting)

            return (
              <div
                key={meeting.id}
                className="flex items-start gap-3 py-3 border-b last:border-b-0"
                style={cardBorder}
              >
                <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                <div className="flex-1 min-w-0">
                  {meeting.client_name ? (
                    <Link
                      href={`/clients/${meeting.client_id}`}
                      className="text-sm font-medium text-text hover:text-primary truncate block"
                    >
                      {primaryLine}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-text truncate block">{primaryLine}</span>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                    <span className="truncate">{secondaryLine}</span>
                    <span className="shrink-0 inline-flex items-center gap-1">
                      {(() => { const Icon = FORMAT_ICONS[meeting.format === 'external' ? 'pin' : meeting.format === 'boutique' ? 'store' : meeting.format === 'call' ? 'phone' : meeting.format === 'video' ? 'video' : 'message']; return <Icon size={11} strokeWidth={1.5} />; })()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Link
              href="/calendar"
              className="text-xs text-text-muted hover:text-primary uppercase tracking-wide"
            >
              {meetings.length} meetings today
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
