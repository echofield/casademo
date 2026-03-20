'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface QueueFiltersProps {
  current: string
  counts: {
    all: number
    overdue: number
    today: number
    upcoming: number
    highValue: number
  }
}

export function QueueFilters({ current, counts }: QueueFiltersProps) {
  const filters = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, urgent: true },
    { key: 'today', label: 'Today', count: counts.today },
    { key: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { key: 'high-value', label: 'High Value', count: counts.highValue },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = current === filter.key
        const showCount = filter.count > 0

        return (
          <Link
            key={filter.key}
            href={filter.key === 'all' ? '/queue' : `/queue?filter=${filter.key}`}
            className={`
              px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em]
              transition-colors duration-200
              ${isActive
                ? 'bg-primary text-surface'
                : 'bg-transparent text-text-muted hover:text-text hover:bg-bg-soft'
              }
              ${filter.urgent && !isActive && filter.count > 0 ? 'text-danger' : ''}
            `}
            style={{
              border: isActive ? 'none' : '1px solid rgba(28, 27, 25, 0.1)',
            }}
          >
            {filter.label}
            {showCount && (
              <span className={`ml-1.5 ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                {filter.count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
