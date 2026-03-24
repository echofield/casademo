'use client'

import { useMemo } from 'react'
import { MeetingWithDetails, MEETING_FORMAT_CONFIG, formatTimeRange } from '@/lib/types/meetings'

interface WeekViewProps {
  meetings: MeetingWithDetails[]
  weekStart: Date
  onMeetingClick?: (meeting: MeetingWithDetails) => void
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 - 20:00
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function WeekView({ meetings, weekStart, onMeetingClick }: WeekViewProps) {
  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [weekStart])

  // Group meetings by day
  const meetingsByDay = useMemo(() => {
    const map = new Map<string, MeetingWithDetails[]>()
    weekDays.forEach(day => {
      map.set(day.toDateString(), [])
    })
    meetings.forEach(meeting => {
      const dayStr = new Date(meeting.start_time).toDateString()
      if (map.has(dayStr)) {
        map.get(dayStr)!.push(meeting)
      }
    })
    return map
  }, [meetings, weekDays])

  // Calculate meeting position and height
  const getMeetingStyle = (meeting: MeetingWithDetails) => {
    const start = new Date(meeting.start_time)
    const end = new Date(meeting.end_time)

    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()

    const topOffset = ((startMinutes - 8 * 60) / 60) * 48 // 48px per hour
    const height = ((endMinutes - startMinutes) / 60) * 48

    return {
      top: `${topOffset}px`,
      height: `${Math.max(height, 24)}px`, // Minimum height
    }
  }

  const today = new Date()
  const currentHour = today.getHours()
  const currentMinutes = today.getMinutes()
  const currentTimeTop = ((currentHour - 8) * 60 + currentMinutes) / 60 * 48

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with day names */}
        <div className="grid grid-cols-8 border-b" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
          <div className="w-16" /> {/* Time column spacer */}
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div
                key={i}
                className={`py-3 text-center border-l ${isToday ? 'bg-primary/5' : ''}`}
                style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
              >
                <div className={`text-xs uppercase tracking-wide ${isToday ? 'text-primary font-medium' : 'text-text-muted'}`}>
                  {DAYS_FR[i]}
                </div>
                <div className={`font-serif text-lg ${isToday ? 'text-primary' : 'text-text'}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time grid */}
        <div className="relative">
          {/* Current time indicator */}
          {currentHour >= 8 && currentHour <= 20 && (
            <div
              className="absolute left-16 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className="absolute -left-2 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
            </div>
          )}

          <div className="grid grid-cols-8">
            {/* Time labels */}
            <div className="w-16">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="h-12 text-right pr-2 text-xs text-text-muted"
                  style={{ lineHeight: '48px' }}
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const dayMeetings = meetingsByDay.get(day.toDateString()) || []
              const isToday = day.toDateString() === today.toDateString()

              return (
                <div
                  key={dayIndex}
                  className={`relative border-l ${isToday ? 'bg-primary/5' : ''}`}
                  style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
                >
                  {/* Hour grid lines */}
                  {HOURS.map(hour => (
                    <div
                      key={hour}
                      className="h-12 border-b"
                      style={{ borderColor: 'rgba(28, 27, 25, 0.05)' }}
                    />
                  ))}

                  {/* Meetings */}
                  {dayMeetings.map(meeting => {
                    const style = getMeetingStyle(meeting)
                    const config = MEETING_FORMAT_CONFIG[meeting.format]

                    return (
                      <button
                        key={meeting.id}
                        onClick={() => onMeetingClick?.(meeting)}
                        className={`
                          absolute left-1 right-1 rounded px-1.5 py-0.5 text-left overflow-hidden
                          ${config.bgColor} ${config.textColor}
                          hover:ring-2 hover:ring-primary/30 transition-shadow
                        `}
                        style={style}
                      >
                        <div className="text-[10px] font-medium truncate">
                          {formatTimeRange(meeting.start_time, meeting.end_time)}
                        </div>
                        <div className="text-xs truncate">
                          {meeting.client_name || meeting.title}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
