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
          <span className="text-sm text-text-muted">No client</span>
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

      <div className="flex items-center gap-2">
        {meeting.client_name ? (
          <Link
            href={`/clients/${meeting.client_id}`}
            className="text-sm text-primary hover:underline"
          >
            {meeting.client_name}
          </Link>
        ) : (
          <span className="text-sm text-text-muted">No client</span>
        )}
        {meeting.client_phone && (
          <a
            href={`https://wa.me/${meeting.client_phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#25D366' }}
            title="WhatsApp"
          >
            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
        )}
      </div>

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
              {meeting.outcome_purchased ? 'Purchase made' : 'Pas d\'achat'}
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
            Complete
          </button>
          <button
            onClick={() => onAction('no_show', meeting)}
            className="py-2 px-3 text-xs font-medium uppercase tracking-wide text-text-muted border border-[#003D2B]/20 hover:bg-[#003D2B]/5 transition-colors"
          >
            No show
          </button>
          <button
            onClick={() => onAction('cancel', meeting)}
            className="py-2 px-3 text-xs font-medium uppercase tracking-wide text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
