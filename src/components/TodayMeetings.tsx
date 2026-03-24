'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Plus } from 'lucide-react'
import {
  MeetingWithDetails,
  MEETING_FORMAT_CONFIG,
  MEETING_STATUS_CONFIG,
  formatTimeRange,
} from '@/lib/types/meetings'

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
          <span className="label text-text-muted">AUJOURD&apos;HUI</span>
        </div>
        <p className="text-text-muted text-sm">Chargement...</p>
      </section>
    )
  }

  return (
    <section className="mt-6 border bg-surface p-6" style={cardBorder}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">AUJOURD&apos;HUI</span>
        </div>
        <Link
          href="/calendar"
          className="text-xs text-primary hover:text-primary-soft uppercase tracking-wide"
        >
          Calendrier →
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-text-muted text-sm mb-3">Aucun rendez-vous aujourd&apos;hui</p>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary border border-primary/20 hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Planifier un RDV
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map(meeting => {
            const formatConfig = MEETING_FORMAT_CONFIG[meeting.format]
            const statusConfig = MEETING_STATUS_CONFIG[meeting.status]
            const timeRange = formatTimeRange(meeting.start_time, meeting.end_time)

            return (
              <div
                key={meeting.id}
                className="flex items-center gap-3 py-3 border-b last:border-b-0"
                style={cardBorder}
              >
                <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                <span className="text-sm font-medium text-text w-24">{timeRange}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${formatConfig.bgColor} ${formatConfig.textColor}`}>
                  {formatConfig.icon} {formatConfig.labelFr}
                </span>
                <div className="flex-1 min-w-0">
                  {meeting.client_name ? (
                    <Link
                      href={`/clients/${meeting.client_id}`}
                      className="text-sm text-text hover:text-primary truncate block"
                    >
                      {meeting.client_name}
                    </Link>
                  ) : (
                    <span className="text-sm text-text-muted">{meeting.title}</span>
                  )}
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <Link
              href="/calendar"
              className="text-xs text-text-muted hover:text-primary uppercase tracking-wide"
            >
              {meetings.length} rendez-vous aujourd&apos;hui
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
