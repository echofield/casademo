'use client'

import { MeetingWithDetails, isMeetingToday } from '@/lib/types/meetings'
import { MeetingCard } from './MeetingCard'

interface AgendaViewProps {
  meetings: MeetingWithDetails[]
  onAction?: (action: 'complete' | 'no_show' | 'cancel' | 'edit', meeting: MeetingWithDetails) => void
}

interface GroupedMeetings {
  label: string
  date: string
  meetings: MeetingWithDetails[]
  isToday: boolean
}

export function AgendaView({ meetings, onAction }: AgendaViewProps) {
  // Group meetings by date
  const groupedMeetings = meetings.reduce<Map<string, MeetingWithDetails[]>>((acc, meeting) => {
    const date = new Date(meeting.start_time).toDateString()
    if (!acc.has(date)) {
      acc.set(date, [])
    }
    acc.get(date)!.push(meeting)
    return acc
  }, new Map())

  // Convert to array with labels
  const groups: GroupedMeetings[] = Array.from(groupedMeetings.entries()).map(([dateStr, meetings]) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let label: string
    if (date.toDateString() === today.toDateString()) {
      label = 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      label = 'Tomorrow'
    } else {
      label = date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    }

    return {
      label,
      date: dateStr,
      meetings,
      isToday: date.toDateString() === today.toDateString(),
    }
  })

  if (meetings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-serif text-2xl text-text mb-2">No meetings</p>
        <p className="text-text-muted">No meetings this week.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.date}>
          <h2
            className={`text-sm font-medium uppercase tracking-wide mb-4 ${
              group.isToday ? 'text-primary' : 'text-text-muted'
            }`}
          >
            {group.label}
            <span className="ml-2 text-text-muted font-normal">
              ({group.meetings.length})
            </span>
          </h2>

          <div className="space-y-3">
            {group.meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
