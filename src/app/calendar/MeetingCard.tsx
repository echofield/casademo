'use client'

import Link from 'next/link'
import { MapPin, CalendarClock, CheckCircle2 } from 'lucide-react'
import { MeetingWithDetails, MEETING_STATUS_CONFIG, formatMeetingOwnerLine, formatTimeRange } from '@/lib/types/meetings'
import { FormatBadge } from './FormatBadge'

interface MeetingCardProps {
  meeting: MeetingWithDetails
  onAction?: (action: 'complete' | 'no_show' | 'cancel' | 'edit', meeting: MeetingWithDetails) => void
  compact?: boolean
}

export function MeetingCard({ meeting, onAction, compact = false }: MeetingCardProps) {
  const statusConfig = MEETING_STATUS_CONFIG[meeting.status]
  const timeRange = formatTimeRange(meeting.start_time, meeting.end_time)
  const isScheduled = meeting.status === 'scheduled'
  const needsReschedule = meeting.status === 'no_show'
  const statusLabel = meeting.status === 'no_show' ? 'To reschedule' : statusConfig.label
  const primaryLine = `${timeRange} — ${meeting.client_name || meeting.title}`
  const secondaryLine = formatMeetingOwnerLine(meeting)

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 py-2 px-3 bg-surface border rounded"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
      >
        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
        <div className="min-w-0 flex-1">
          {meeting.client_name ? (
            <Link
              href={`/clients/${meeting.client_id}`}
              className="text-sm text-text hover:text-primary transition-colors truncate block"
            >
              {primaryLine}
            </Link>
          ) : (
            <span className="text-sm text-text truncate block">{primaryLine}</span>
          )}
          <span className="text-xs text-text-muted truncate block">{secondaryLine}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="bg-surface border p-4 md:p-5"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
            <span className="text-sm font-medium text-text">{timeRange}</span>
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">
            {statusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {meeting.status !== 'scheduled' && (
            <span className="inline-flex items-center rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-text-muted" style={{ borderColor: 'rgba(28, 27, 25, 0.12)' }}>
              {statusLabel}
            </span>
          )}
          <FormatBadge format={meeting.format} />
        </div>
      </div>

      <div className="mb-3">
        {meeting.client_name ? (
          <Link
            href={`/clients/${meeting.client_id}`}
            className="font-serif text-xl text-text hover:text-primary transition-colors"
          >
            {primaryLine}
          </Link>
        ) : (
          <span className="font-serif text-xl text-text">{primaryLine}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-muted">
        <span>{secondaryLine}</span>
        {meeting.client_phone && (
          <a
            href={`https://wa.me/${meeting.client_phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors"
            title="WhatsApp"
          >
            WhatsApp
          </a>
        )}
      </div>

      {meeting.format === 'external' && meeting.location && (
        <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
          <MapPin size={12} strokeWidth={1.5} />
          {meeting.location}
        </p>
      )}

      {meeting.description && (
        <p className="text-sm text-text-muted mt-2 line-clamp-2">
          {meeting.description}
        </p>
      )}

      {meeting.status === 'completed' && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className={meeting.outcome_purchased ? 'text-green-600' : 'text-text-muted'}>
              {meeting.outcome_purchased ? 'Purchase made' : 'No purchase'}
            </span>
          </div>
          {meeting.outcome_notes && (
            <p className="text-xs text-text-muted mt-1">{meeting.outcome_notes}</p>
          )}
        </div>
      )}

      {(isScheduled || needsReschedule) && onAction && (
        <div className="mt-4 pt-3 border-t flex flex-wrap gap-2" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <button
            onClick={() => onAction('edit', meeting)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-text-muted border border-[rgba(28,27,25,0.12)] hover:text-text hover:border-[rgba(28,27,25,0.24)] transition-colors"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Reschedule
          </button>
          {isScheduled && (
            <button
              onClick={() => onAction('complete', meeting)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-white bg-[#003D2B] hover:bg-[#004D38] transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark done
            </button>
          )}
        </div>
      )}
    </div>
  )
}
