'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MeetingWithDetails, MEETING_STATUS_CONFIG, formatMeetingOwnerLine, formatTimeRange } from '@/lib/types/meetings'
import { FormatBadge } from './FormatBadge'

interface WeekViewProps {
  meetings: MeetingWithDetails[]
  weekStart: Date
  onMeetingClick?: (meeting: MeetingWithDetails) => void
  onEmptySlotClick?: (date: Date, hour: number) => void
  isSupervisor?: boolean
  sellers?: { id: string; name: string }[]
}

export function WeekView({
  meetings,
  weekStart,
  onMeetingClick,
  isSupervisor = false,
  sellers = [],
}: WeekViewProps) {
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)
  const displaySellers = useMemo(() => {
    const seen = new Set<string>()
    return sellers.filter((seller) => {
      const key = `${seller.id}:${seller.name.trim().toLowerCase()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [sellers])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [weekStart])

  const filteredMeetings = useMemo(() => {
    if (!isSupervisor || !selectedSellerId) {
      return meetings.filter((meeting) => meeting.status !== 'cancelled')
    }
    return meetings.filter((meeting) => meeting.seller_id === selectedSellerId && meeting.status !== 'cancelled')
  }, [meetings, selectedSellerId, isSupervisor])

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, MeetingWithDetails[]>()
    weekDays.forEach((day) => {
      map.set(day.toDateString(), [])
    })

    filteredMeetings.forEach((meeting) => {
      const dayKey = new Date(meeting.start_time).toDateString()
      if (map.has(dayKey)) {
        map.get(dayKey)!.push(meeting)
      }
    })

    map.forEach((dayMeetings, key) => {
      map.set(
        key,
        [...dayMeetings].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      )
    })

    return map
  }, [filteredMeetings, weekDays])

  const today = new Date()

  return (
    <div className="flex flex-col">
      {isSupervisor && displaySellers.length > 0 && (
        <div className="mb-4 relative">
          <button
            onClick={() => setShowSellerDropdown(!showSellerDropdown)}
            className="flex items-center gap-2 border px-4 py-2 text-sm text-[#003D2B] transition-colors hover:border-[#003D2B]/30"
            style={{
              backgroundColor: 'rgba(250, 248, 242, 0.94)',
              borderColor: 'rgba(27, 67, 50, 0.12)',
            }}
          >
            <span>
              {selectedSellerId
                ? displaySellers.find((seller) => seller.id === selectedSellerId)?.name || 'Unknown'
                : 'Team'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showSellerDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSellerDropdown(false)} />
              <div
                className="absolute top-full left-0 z-20 mt-1 min-w-[200px] border shadow-lg"
                style={{
                  backgroundColor: 'rgba(250, 248, 242, 0.98)',
                  borderColor: 'rgba(27, 67, 50, 0.12)',
                  boxShadow: '0 18px 40px rgba(27, 67, 50, 0.08)',
                }}
              >
                <button
                  onClick={() => { setSelectedSellerId(null); setShowSellerDropdown(false) }}
                  className={"w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#003D2B]/5 " + (!selectedSellerId ? "bg-[#003D2B]/5 text-[#003D2B] font-medium" : "text-[#003D2B]/70")}
                >
                  Team
                </button>
                {displaySellers.map((seller) => (
                  <button
                    key={seller.id}
                    onClick={() => { setSelectedSellerId(seller.id); setShowSellerDropdown(false) }}
                    className={"w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[#003D2B]/5 " + (selectedSellerId === seller.id ? "bg-[#003D2B]/5 text-[#003D2B] font-medium" : "text-[#003D2B]/70")}
                  >
                    {seller.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-7">
        {weekDays.map((day) => {
          const isToday = day.toDateString() === today.toDateString()
          const dayMeetings = meetingsByDay.get(day.toDateString()) || []
          const dayLabel = day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
          const dateLabel = day.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })

          return (
            <section
              key={day.toISOString()}
              className="overflow-hidden border"
              style={{
                borderColor: isToday ? 'rgba(27, 67, 50, 0.16)' : 'rgba(28, 27, 25, 0.06)',
                backgroundColor: isToday ? 'rgba(244, 247, 242, 0.92)' : 'rgba(248, 246, 240, 0.82)',
                boxShadow: isToday ? '0 18px 34px rgba(27, 67, 50, 0.04)' : '0 8px 22px rgba(28, 27, 25, 0.015)',
              }}
            >
              <div
                className="border-b px-4 py-5"
                style={{
                  borderColor: isToday ? 'rgba(27, 67, 50, 0.12)' : 'rgba(28, 27, 25, 0.05)',
                  backgroundColor: isToday ? 'rgba(27, 67, 50, 0.04)' : 'rgba(250, 248, 242, 0.68)',
                }}
              >
                <p className={`text-[11px] uppercase tracking-[0.18em] ${isToday ? 'text-[#003D2B]' : 'text-text-muted'}`}>
                  {dayLabel}
                </p>
                <h3 className="mt-2 font-serif text-[32px] leading-none text-text">{dateLabel}</h3>
              </div>

              <div className="space-y-3 px-3 py-3">
                {dayMeetings.length === 0 ? (
                  <div
                    className="px-2 py-4 text-sm text-text-muted"
                    style={{ backgroundColor: 'rgba(250, 248, 242, 0.38)' }}
                  >
                    No meetings
                  </div>
                ) : (
                  dayMeetings.map((meeting) => {
                    const statusConfig = MEETING_STATUS_CONFIG[meeting.status]
                    const timeLabel = formatTimeRange(meeting.start_time, meeting.end_time)
                    const primaryLine = `${timeLabel} — ${meeting.client_name || meeting.title}`
                    const secondaryLine = formatMeetingOwnerLine(meeting)
                    const borderColor =
                      meeting.status === 'no_show'
                        ? 'rgba(195, 71, 71, 0.45)'
                        : meeting.status === 'scheduled'
                          ? 'rgba(27, 67, 50, 0.35)'
                          : 'rgba(28, 27, 25, 0.12)'

                    return (
                      <button
                        key={meeting.id}
                        type="button"
                        onClick={() => onMeetingClick?.(meeting)}
                        className="w-full border px-4 py-4 text-left transition-colors"
                        style={{
                          borderColor,
                          borderLeftWidth: 3,
                          backgroundColor: isToday ? 'rgba(250, 248, 242, 0.9)' : 'rgba(250, 248, 242, 0.76)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-serif text-[24px] leading-tight text-text">
                              {primaryLine}
                            </p>
                            <p className="mt-2 text-sm text-text-muted">
                              {secondaryLine}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                            <FormatBadge format={meeting.format} size="sm" />
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
