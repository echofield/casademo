'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  MeetingWithDetails,
  CalendarEvent,
  toCalendarEvent,
  MEETING_FORMAT_CONFIG,
  FORMAT_BORDER_COLORS,
  SELLER_COLORS,
} from '@/lib/types/meetings'

const HOUR_HEIGHT = 40
const START_HOUR = 8
const END_HOUR = 24
const TOTAL_HOURS = END_HOUR - START_HOUR
const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT
const TIME_GUTTER_WIDTH = 60
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const hour = START_HOUR + i
  return hour === 24 ? '00:00' : String(hour).padStart(2, '0') + ':00'
})

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
  onEmptySlotClick,
  isSupervisor = false,
  sellers = [],
}: WeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showSellerDropdown, setShowSellerDropdown] = useState(false)

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      return date
    })
  }, [weekStart])

  const sellerColorMap = useMemo(() => {
    const map = new Map<string, typeof SELLER_COLORS[number]>()
    const uniqueSellers = Array.from(new Set(meetings.map(m => m.seller_id)))
    uniqueSellers.forEach((sellerId, index) => {
      map.set(sellerId, SELLER_COLORS[index % SELLER_COLORS.length])
    })
    return map
  }, [meetings])

  const filteredMeetings = useMemo(() => {
    if (!isSupervisor || !selectedSellerId) {
      return meetings.filter(m => m.status !== 'cancelled')
    }
    return meetings.filter(m => m.seller_id === selectedSellerId && m.status !== 'cancelled')
  }, [meetings, selectedSellerId, isSupervisor])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    weekDays.forEach(day => {
      map.set(day.toDateString(), [])
    })
    filteredMeetings.forEach(meeting => {
      const event = toCalendarEvent(meeting)
      const dayStr = new Date(meeting.start_time).toDateString()
      if (map.has(dayStr)) {
        map.get(dayStr)!.push(event)
      }
    })
    return map
  }, [filteredMeetings, weekDays])

  useEffect(() => {
    if (scrollContainerRef.current) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimePosition = ((currentHour - START_HOUR) + currentMinute / 60) * HOUR_HEIGHT
      const containerHeight = scrollContainerRef.current.clientHeight
      const scrollTo = Math.max(0, currentTimePosition - containerHeight / 2)
      scrollContainerRef.current.scrollTop = scrollTo
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const currentTimePosition = useMemo(() => {
    const hour = currentTime.getHours()
    const minute = currentTime.getMinutes()
    const position = ((hour - START_HOUR) + minute / 60) * HOUR_HEIGHT
    return Math.max(0, Math.min(GRID_HEIGHT, position))
  }, [currentTime])

  const today = new Date()
  const isCurrentTimeVisible = currentTime.getHours() >= START_HOUR && currentTime.getHours() < END_HOUR

  const getEventStyle = (event: CalendarEvent) => {
    const top = ((event.startHour - START_HOUR) + event.startMinute / 60) * HOUR_HEIGHT
    const height = Math.max((event.durationMinutes / 60) * HOUR_HEIGHT, 20)
    return { top: top + 'px', height: height + 'px' }
  }

  const getEventColors = (event: CalendarEvent) => {
    if (isSupervisor && !selectedSellerId) {
      const colors = sellerColorMap.get(event.sellerId)
      if (colors) return { bg: colors.bg, border: colors.border }
    }
    const config = MEETING_FORMAT_CONFIG[event.format]
    return { bg: config.bgColor, border: FORMAT_BORDER_COLORS[event.format] }
  }

  const handleGridClick = (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
    if (!onEmptySlotClick) return
    const target = e.target as HTMLElement
    if (target.closest('[data-event]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const clickedHour = Math.floor(clickY / HOUR_HEIGHT) + START_HOUR
    const date = new Date(weekDays[dayIndex])
    date.setHours(clickedHour, 0, 0, 0)
    onEmptySlotClick(date, clickedHour)
  }

  const formatEventTime = (event: CalendarEvent) => {
    const sh = String(event.startHour).padStart(2, '0')
    const sm = String(event.startMinute).padStart(2, '0')
    const eh = String(event.endHour).padStart(2, '0')
    const em = String(event.endMinute).padStart(2, '0')
    return sh + ':' + sm + ' - ' + eh + ':' + em
  }

  return (
    <div className="flex flex-col">
      {isSupervisor && sellers.length > 0 && (
        <div className="mb-4 relative">
          <button
            onClick={() => setShowSellerDropdown(!showSellerDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#003D2B]/10 rounded text-sm text-[#003D2B] hover:border-[#003D2B]/30 transition-colors"
          >
            <span>
              {selectedSellerId
                ? sellers.find(s => s.id === selectedSellerId)?.name || 'Unknown'
                : 'All sellers'}
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showSellerDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSellerDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#003D2B]/10 rounded shadow-lg z-20 min-w-[200px]">
                <button
                  onClick={() => { setSelectedSellerId(null); setShowSellerDropdown(false) }}
                  className={"w-full px-4 py-2 text-left text-sm hover:bg-[#003D2B]/5 " + (!selectedSellerId ? "bg-[#003D2B]/5 text-[#003D2B] font-medium" : "text-[#003D2B]/70")}
                >
                  All sellers
                </button>
                {sellers.map(seller => (
                  <button
                    key={seller.id}
                    onClick={() => { setSelectedSellerId(seller.id); setShowSellerDropdown(false) }}
                    className={"w-full px-4 py-2 text-left text-sm hover:bg-[#003D2B]/5 " + (selectedSellerId === seller.id ? "bg-[#003D2B]/5 text-[#003D2B] font-medium" : "text-[#003D2B]/70")}
                  >
                    {seller.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="border border-[#003D2B]/10 rounded-lg overflow-hidden bg-white">
        <div
          className="grid sticky top-0 z-10 bg-[#F7F4EE] border-b border-[#003D2B]/10"
          style={{ gridTemplateColumns: TIME_GUTTER_WIDTH + 'px repeat(7, 1fr)' }}
        >
          <div className="border-r border-[#003D2B]/10" />
          {weekDays.map((day, i) => {
            const isToday = day.toDateString() === today.toDateString()
            return (
              <div key={i} className={"py-3 text-center border-r border-[#003D2B]/10 last:border-r-0 " + (isToday ? "bg-[#003D2B]/[0.03]" : "")}>
                <div className={"text-xs uppercase tracking-wide " + (isToday ? "text-[#003D2B] font-medium" : "text-[#003D2B]/50")}>{DAYS[i]}</div>
                <div className={"font-serif text-lg " + (isToday ? "text-[#003D2B]" : "text-[#003D2B]/80")}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>

        <div
          ref={scrollContainerRef}
          className="overflow-y-auto"
          style={{
            height: `min(calc(100vh - 280px), ${GRID_HEIGHT}px)`,
            minHeight: '400px',
          }}
        >
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: TIME_GUTTER_WIDTH + 'px repeat(7, 1fr)',
              height: GRID_HEIGHT + 'px',
              minHeight: GRID_HEIGHT + 'px',
            }}
          >
            {isCurrentTimeVisible && (
              <div className="absolute z-20 pointer-events-none" style={{ top: currentTimePosition + 'px', left: TIME_GUTTER_WIDTH + 'px', right: 0 }}>
                {weekDays.map((day, i) => {
                  if (day.toDateString() !== today.toDateString()) return null
                  const colWidth = 'calc((100% - ' + TIME_GUTTER_WIDTH + 'px) / 7)'
                  return <div key={i} className="absolute h-0 border-t-2 border-[#C34747]" style={{ left: 'calc(' + i + ' * ' + colWidth + ')', width: colWidth }} />
                })}
              </div>
            )}
            <div className="relative border-r border-[#003D2B]/10">
              {HOURS.map((hourLabel, i) => (
                <div key={hourLabel} className="absolute right-2 text-xs text-[#003D2B]/50 -translate-y-1/2" style={{ top: (i * HOUR_HEIGHT) + 'px' }}>{hourLabel}</div>
              ))}
            </div>
            {weekDays.map((day, dayIndex) => {
              const dayEvents = eventsByDay.get(day.toDateString()) || []
              const isToday = day.toDateString() === today.toDateString()
              return (
                <div key={dayIndex} className={"relative border-r border-[#003D2B]/10 last:border-r-0 cursor-pointer " + (isToday ? "bg-[#003D2B]/[0.03]" : "")} onClick={(e) => handleGridClick(e, dayIndex)}>
                  {HOURS.slice(0, -1).map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-t border-[#003D2B]/5" style={{ top: (i * HOUR_HEIGHT) + 'px' }} />
                  ))}
                  {dayEvents.map(event => {
                    const style = getEventStyle(event)
                    const colors = getEventColors(event)
                    const showFormat = parseInt(style.height) >= 40
                    return (
                      <button key={event.id} data-event="true" onClick={(e) => { e.stopPropagation(); onMeetingClick?.(event.originalMeeting) }} className={"absolute left-1 right-1 rounded px-2 py-1 text-left overflow-hidden border-l-2 hover:ring-2 hover:ring-[#003D2B]/20 transition-shadow " + colors.bg + " " + colors.border} style={style}>
                        <div className="text-[11px] text-[#003D2B]/60 truncate">{formatEventTime(event)}</div>
                        <div className="text-[13px] font-medium text-[#003D2B] truncate">{event.clientName || event.title}</div>
                        {showFormat && <div className="text-[11px] text-[#003D2B]/50 truncate">{MEETING_FORMAT_CONFIG[event.format].label}</div>}
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
