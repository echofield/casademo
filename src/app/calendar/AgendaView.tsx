'use client'

import { MeetingWithDetails, groupMeetingsForSurface } from '@/lib/types/meetings'
import { MeetingCard } from './MeetingCard'

interface AgendaViewProps {
  meetings: MeetingWithDetails[]
  onAction?: (action: 'complete' | 'no_show' | 'cancel' | 'edit', meeting: MeetingWithDetails) => void
}

export function AgendaView({ meetings, onAction }: AgendaViewProps) {
  const buckets = groupMeetingsForSurface(meetings)
  const sections = [
    {
      id: 'today',
      title: 'Today',
      meetings: buckets.today,
      tone: 'default' as const,
      subtitle: 'What is next',
    },
    {
      id: 'tomorrow',
      title: 'Tomorrow',
      meetings: buckets.tomorrow,
      tone: 'default' as const,
      subtitle: 'What is coming next',
    },
    {
      id: 'later',
      title: 'Later this week',
      meetings: buckets.laterThisWeek,
      tone: 'default' as const,
      subtitle: 'Upcoming',
    },
    {
      id: 'missed',
      title: 'Missed / To reschedule',
      meetings: buckets.missed,
      tone: 'urgent' as const,
      subtitle: 'Needs attention',
    },
  ].filter((section) => section.meetings.length > 0)

  if (sections.length === 0) {
    return (
      <div
        className="border bg-surface px-6 py-12"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
      >
        <p className="font-serif text-2xl text-text">No meetings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => {
        const isUrgent = section.tone === 'urgent'
        return (
          <section
            key={section.id}
            className={isUrgent ? 'border px-5 py-5 md:px-6' : ''}
            style={isUrgent ? {
              borderColor: 'rgba(195, 71, 71, 0.18)',
              backgroundColor: 'rgba(195, 71, 71, 0.03)',
            } : undefined}
          >
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className={`text-[11px] uppercase tracking-[0.18em] ${isUrgent ? 'text-danger' : 'text-text-muted'}`}>
                  {section.subtitle}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-text">
                  {section.title}
                </h2>
              </div>
              <span className={`text-xs uppercase tracking-[0.16em] ${isUrgent ? 'text-danger' : 'text-text-muted'}`}>
                {section.meetings.length}
              </span>
            </div>

            <div className="space-y-3">
              {section.meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onAction={onAction}
              />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
