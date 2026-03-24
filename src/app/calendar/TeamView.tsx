'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Store, MapPin, Phone, Video, MessageCircle } from 'lucide-react'
import {
  MeetingWithDetails,
  MEETING_FORMAT_CONFIG,
  MEETING_STATUS_CONFIG,
  formatTimeRange,
} from '@/lib/types/meetings'

const FORMAT_ICONS = {
  store: Store,
  pin: MapPin,
  phone: Phone,
  video: Video,
  message: MessageCircle,
}

interface TeamViewProps {
  meetings: MeetingWithDetails[]
  onMeetingClick?: (meeting: MeetingWithDetails) => void
}

interface SellerGroup {
  sellerId: string
  sellerName: string
  meetings: MeetingWithDetails[]
}

export function TeamView({ meetings, onMeetingClick }: TeamViewProps) {
  // Group meetings by seller
  const sellerGroups = useMemo(() => {
    const groups = new Map<string, SellerGroup>()

    meetings.forEach(meeting => {
      if (!groups.has(meeting.seller_id)) {
        groups.set(meeting.seller_id, {
          sellerId: meeting.seller_id,
          sellerName: meeting.seller_name,
          meetings: [],
        })
      }
      groups.get(meeting.seller_id)!.meetings.push(meeting)
    })

    // Sort by seller name
    return Array.from(groups.values()).sort((a, b) =>
      a.sellerName.localeCompare(b.sellerName)
    )
  }, [meetings])

  // Calculate stats
  const totalMeetings = meetings.length
  const boutiqueMeetings = meetings.filter(m => m.format === 'boutique').length
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled').length

  const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' }

  if (meetings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-2xl text-text mb-2">No meetings</p>
        <p className="text-text-muted">No team meetings this week.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border bg-surface p-4 text-center" style={cardBorder}>
          <p className="font-serif text-2xl text-text">{totalMeetings}</p>
          <p className="text-xs text-text-muted uppercase tracking-wide">Meetings this week</p>
        </div>
        <div className="border bg-surface p-4 text-center" style={cardBorder}>
          <p className="font-serif text-2xl text-primary">{boutiqueMeetings}</p>
          <p className="text-xs text-text-muted uppercase tracking-wide">In store</p>
        </div>
        <div className="border bg-surface p-4 text-center" style={cardBorder}>
          <p className="font-serif text-2xl text-text">{scheduledMeetings}</p>
          <p className="text-xs text-text-muted uppercase tracking-wide">Pending</p>
        </div>
      </div>

      {/* Grouped by seller */}
      <div className="space-y-8">
        {sellerGroups.map(group => (
          <div key={group.sellerId}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl text-text">{group.sellerName}</h3>
              <span className="text-sm text-text-muted">
                {group.meetings.length} meetings
              </span>
            </div>

            <div className="space-y-2">
              {group.meetings.map(meeting => {
                const formatConfig = MEETING_FORMAT_CONFIG[meeting.format]
                const statusConfig = MEETING_STATUS_CONFIG[meeting.status]
                const Icon = FORMAT_ICONS[formatConfig.iconType]
                const timeRange = formatTimeRange(meeting.start_time, meeting.end_time)
                const meetingDate = new Date(meeting.start_time).toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })

                return (
                  <button
                    key={meeting.id}
                    onClick={() => onMeetingClick?.(meeting)}
                    className="w-full flex items-center gap-3 p-3 bg-surface border hover:bg-bg-soft transition-colors text-left"
                    style={cardBorder}
                  >
                    <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                    <span className="text-xs text-text-muted w-20">{meetingDate}</span>
                    <span className="text-sm font-medium text-text w-28">{timeRange}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${formatConfig.bgColor} ${formatConfig.textColor}`}>
                      <Icon size={10} strokeWidth={1.5} />
                    </span>
                    <div className="flex-1 min-w-0">
                      {meeting.client_name ? (
                        <span className="text-sm text-text truncate block">
                          {meeting.client_name}
                        </span>
                      ) : (
                        <span className="text-sm text-text-muted">{meeting.title}</span>
                      )}
                    </div>
                    {meeting.status === 'completed' && meeting.outcome_purchased && (
                      <span className="text-xs text-green-600 px-2 py-0.5 bg-green-50 rounded">
                        Purchase
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
