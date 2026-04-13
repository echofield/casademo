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
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const res = await fetch(
          `/api/meetings?start=${today.toISOString()}&end=${tomorrow.toISOString()}`
        )
        if (res.ok) {
          const data = await res.json()
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
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">TODAY</span>
        </div>
        <div className="space-y-3">
          {[1, 2].map((row) => (
            <div key={row} className="border-b pb-3 last:border-b-0 last:pb-0" style={cardBorder}>
              <div className="skeleton-block mb-2 h-4 w-40" />
              <div className="skeleton-block h-3 w-56" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 border bg-surface p-6" style={cardBorder}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">TODAY</span>
        </div>
        <Link
          href="/calendar"
          className="text-xs uppercase tracking-wide text-primary hover:text-primary-soft"
        >
          Calendar {'>'}
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="py-6 text-center">
          <p className="mb-3 text-sm text-text-muted">No meetings today</p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 border border-primary/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary transition-colors hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" />
            Schedule a meeting
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => {
            const statusConfig = MEETING_STATUS_CONFIG[meeting.status]
            const timeRange = formatTimeRange(meeting.start_time, meeting.end_time)
            const primaryLine = `${timeRange} - ${meeting.client_name || meeting.title}`
            const secondaryLine = formatMeetingOwnerLine(meeting)

            return (
              <div
                key={meeting.id}
                className="flex items-start gap-3 border-b py-3 last:border-b-0"
                style={cardBorder}
              >
                <div className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                <div className="min-w-0 flex-1">
                  {meeting.client_name ? (
                    <Link
                      href={`/clients/${meeting.client_id}`}
                      className="block truncate text-sm font-medium text-text hover:text-primary"
                    >
                      {primaryLine}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-medium text-text">{primaryLine}</span>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                    <span className="truncate">{secondaryLine}</span>
                    <span className="inline-flex shrink-0 items-center gap-1">
                      {(() => {
                        const Icon = FORMAT_ICONS[
                          meeting.format === 'external'
                            ? 'pin'
                            : meeting.format === 'boutique'
                              ? 'store'
                              : meeting.format === 'call'
                                ? 'phone'
                                : meeting.format === 'video'
                                  ? 'video'
                                  : 'message'
                        ]
                        return <Icon size={11} strokeWidth={1.5} />
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Link
              href="/calendar"
              className="text-xs uppercase tracking-wide text-text-muted hover:text-primary"
            >
              {meetings.length} meetings today
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
