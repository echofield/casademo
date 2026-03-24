'use client'

import Link from 'next/link'
import { MeetingWithDetails, MEETING_STATUS_CONFIG, formatTimeRange } from '@/lib/types/meetings'
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

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 py-2 px-3 bg-surface border rounded"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
      >
        <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
        <span className="text-xs text-text-muted font-medium">{timeRange}</span>
        <FormatBadge format={meeting.format} size="sm" />
        {meeting.client_name ? (
          <Link
            href={`/clients/${meeting.client_id}`}
            className="text-sm text-text hover:text-primary transition-colors truncate"
          >
            {meeting.client_name}
          </Link>
        ) : (
          <span className="text-sm text-text-muted">Sans client</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="bg-surface border p-4"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
          <span className="text-sm font-medium text-text">{timeRange}</span>
        </div>
        <FormatBadge format={meeting.format} />
      </div>

      {/* Title & Client */}
      <h3 className="font-serif text-lg text-text mb-1">{meeting.title}</h3>

      {meeting.client_name ? (
        <Link
          href={`/clients/${meeting.client_id}`}
          className="text-sm text-primary hover:underline"
        >
          {meeting.client_name}
        </Link>
      ) : (
        <span className="text-sm text-text-muted">Sans client</span>
      )}

      {/* Location for external */}
      {meeting.format === 'external' && meeting.location && (
        <p className="text-xs text-text-muted mt-2">
          📍 {meeting.location}
        </p>
      )}

      {/* Description */}
      {meeting.description && (
        <p className="text-sm text-text-muted mt-2 line-clamp-2">
          {meeting.description}
        </p>
      )}

      {/* Outcome for completed meetings */}
      {meeting.status === 'completed' && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <div className="flex items-center gap-2 text-sm">
            <span className={meeting.outcome_purchased ? 'text-green-600' : 'text-text-muted'}>
              {meeting.outcome_purchased ? 'Achat effectue' : 'Pas d\'achat'}
            </span>
          </div>
          {meeting.outcome_notes && (
            <p className="text-xs text-text-muted mt-1">{meeting.outcome_notes}</p>
          )}
        </div>
      )}

      {/* Actions for scheduled meetings */}
      {isScheduled && onAction && (
        <div className="mt-4 pt-3 border-t flex gap-2" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <button
            onClick={() => onAction('complete', meeting)}
            className="flex-1 py-2 text-xs font-medium uppercase tracking-wide text-white bg-[#003D2B] hover:bg-[#004D38] transition-colors"
          >
            Terminer
          </button>
          <button
            onClick={() => onAction('no_show', meeting)}
            className="py-2 px-3 text-xs font-medium uppercase tracking-wide text-text-muted border border-[#003D2B]/20 hover:bg-[#003D2B]/5 transition-colors"
          >
            Absent
          </button>
          <button
            onClick={() => onAction('cancel', meeting)}
            className="py-2 px-3 text-xs font-medium uppercase tracking-wide text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  )
}
