'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarNavProps {
  weekStart: Date
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  view: 'agenda' | 'week' | 'team'
  onViewChange: (view: 'agenda' | 'week' | 'team') => void
  showTeamView?: boolean
}

export function CalendarNav({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
  view,
  onViewChange,
  showTeamView = false,
}: CalendarNavProps) {
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const formatRange = () => {
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' })

    if (startMonth === endMonth) {
      return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${weekEnd.getFullYear()}`
    }
    return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${weekEnd.getFullYear()}`
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevWeek}
          className="p-2 hover:bg-[#003D2B]/5 rounded transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5 text-text" />
        </button>

        <button
          onClick={onToday}
          className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-text-muted border border-[#003D2B]/20 hover:bg-[#003D2B]/5 transition-colors"
        >
          Today
        </button>

        <button
          onClick={onNextWeek}
          className="p-2 hover:bg-[#003D2B]/5 rounded transition-colors"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5 text-text" />
        </button>

        <span className="ml-2 font-serif text-lg text-text">
          {formatRange()}
        </span>
      </div>

      {/* View toggle */}
      <div className="flex border border-[#003D2B]/20 divide-x divide-[#003D2B]/20">
        <button
          onClick={() => onViewChange('agenda')}
          className={`px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
            view === 'agenda'
              ? 'bg-[#003D2B] text-white'
              : 'text-text-muted hover:bg-[#003D2B]/5'
          }`}
        >
          Agenda
        </button>
        <button
          onClick={() => onViewChange('week')}
          className={`px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
            view === 'week'
              ? 'bg-[#003D2B] text-white'
              : 'text-text-muted hover:bg-[#003D2B]/5'
          }`}
        >
          Semaine
        </button>
        {showTeamView && (
          <button
            onClick={() => onViewChange('team')}
            className={`px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
              view === 'team'
                ? 'bg-[#003D2B] text-white'
                : 'text-text-muted hover:bg-[#003D2B]/5'
            }`}
          >
            Equipe
          </button>
        )}
      </div>
    </div>
  )
}
