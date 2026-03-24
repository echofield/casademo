'use client'

import { MeetingFormat, MEETING_FORMAT_CONFIG } from '@/lib/types/meetings'

interface FormatBadgeProps {
  format: MeetingFormat
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function FormatBadge({ format, showIcon = true, size = 'md' }: FormatBadgeProps) {
  const config = MEETING_FORMAT_CONFIG[format]

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-1 text-xs'

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses}
      `}
    >
      {showIcon && <span>{config.icon}</span>}
      <span>{config.labelFr}</span>
    </span>
  )
}
