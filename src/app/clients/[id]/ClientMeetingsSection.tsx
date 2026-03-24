'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Plus, Store, MapPin, Phone, Video, MessageCircle } from 'lucide-react'
import {
  MeetingWithDetails,
  MeetingInsert,
  MEETING_FORMAT_CONFIG,
  MEETING_STATUS_CONFIG,
  formatTimeRange,
} from '@/lib/types/meetings'
import { AddMeetingModal } from '@/app/calendar/AddMeetingModal'

const FORMAT_ICONS = {
  store: Store,
  pin: MapPin,
  phone: Phone,
  video: Video,
  message: MessageCircle,
}

interface ClientMeetingsSectionProps {
  clientId: string
  clientName: string
  canEdit: boolean
}

export function ClientMeetingsSection({ clientId, clientName, canEdit }: ClientMeetingsSectionProps) {
  const [meetings, setMeetings] = useState<MeetingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // Fetch meetings for this client
  useEffect(() => {
    async function fetchMeetings() {
      try {
        // Get meetings from past month to future month
        const start = new Date()
        start.setMonth(start.getMonth() - 1)
        const end = new Date()
        end.setMonth(end.getMonth() + 3)

        const res = await fetch(
          `/api/meetings?client_id=${clientId}&start=${start.toISOString()}&end=${end.toISOString()}`
        )
        if (res.ok) {
          const data = await res.json()
          setMeetings(data.data || [])
        }
      } catch (err) {
        console.error('Error fetching client meetings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [clientId])

  // Find next scheduled meeting
  const now = new Date()
  const nextMeeting = meetings.find(
    m => m.status === 'scheduled' && new Date(m.start_time) > now
  )

  // Past meetings (last 5)
  const pastMeetings = meetings
    .filter(m => m.status !== 'scheduled' || new Date(m.start_time) <= now)
    .slice(0, 5)

  const handleCreateMeeting = async (meeting: MeetingInsert) => {
    const res = await fetch('/api/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to create meeting')
    }

    // Refresh meetings
    const newMeeting = await res.json()
    setMeetings(prev => [newMeeting.data, ...prev])
  }

  const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <section className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="label mb-2 text-text-muted">Schedule</p>
          <h2 className="font-serif text-2xl text-text">Meetings</h2>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide text-white bg-[#003D2B] hover:bg-[#004D38] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : (
        <>
          {/* Next meeting */}
          {nextMeeting ? (
            <div className="mb-6 p-4 bg-[#003D2B]/5 border border-[#003D2B]/10">
              <p className="label text-text-muted mb-2">Next meeting</p>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-serif text-lg text-text">
                    {formatDate(nextMeeting.start_time)} - {formatTimeRange(nextMeeting.start_time, nextMeeting.end_time).split(' – ')[0]}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${MEETING_FORMAT_CONFIG[nextMeeting.format].bgColor} ${MEETING_FORMAT_CONFIG[nextMeeting.format].textColor}`}>
                      {(() => { const Icon = FORMAT_ICONS[MEETING_FORMAT_CONFIG[nextMeeting.format].iconType]; return <Icon size={12} strokeWidth={1.5} />; })()}
                      {MEETING_FORMAT_CONFIG[nextMeeting.format].label}
                    </span>
                    <span className="text-xs text-text-muted">{nextMeeting.title}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-bg-soft border" style={cardBorder}>
              <p className="text-sm text-text-muted">No upcoming meetings</p>
            </div>
          )}

          {/* Past meetings */}
          <div>
            <p className="label text-text-muted mb-3">History</p>
            {pastMeetings.length > 0 ? (
              <div className="space-y-2">
                {pastMeetings.map(meeting => {
                  const formatConfig = MEETING_FORMAT_CONFIG[meeting.format]
                  const statusConfig = MEETING_STATUS_CONFIG[meeting.status]

                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center gap-3 py-2 border-b last:border-b-0"
                      style={cardBorder}
                    >
                      <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
                      <span className="text-xs text-text-muted w-20">{formatDate(meeting.start_time)}</span>
                      <span className={`px-1.5 py-0.5 text-[10px] rounded-full flex items-center ${formatConfig.bgColor} ${formatConfig.textColor}`}>
                        {(() => { const Icon = FORMAT_ICONS[formatConfig.iconType]; return <Icon size={10} strokeWidth={1.5} />; })()}
                      </span>
                      <span className="text-sm text-text flex-1 truncate">{meeting.title}</span>
                      {meeting.outcome_purchased && (
                        <span className="text-xs text-green-600">Purchase</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No past meetings</p>
            )}
          </div>

          {/* Link to full calendar */}
          <Link
            href={`/calendar?client_id=${clientId}`}
            className="label mt-4 inline-block text-primary hover:text-primary-soft"
          >
            View full history →
          </Link>
        </>
      )}

      {/* Add Meeting Modal */}
      <AddMeetingModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateMeeting}
        preselectedClientId={clientId}
      />
    </section>
  )
}
