'use client'

import { Store, MapPin, Phone, Video, MessageCircle } from 'lucide-react'
import { MeetingFormat, MEETING_FORMAT_CONFIG } from '@/lib/types/meetings'

interface FormatBadgeProps {
  format: MeetingFormat
  showIcon?: boolean
  size?: 'sm' | 'md'
}

const ICONS = {
  store: Store,
  pin: MapPin,
  phone: Phone,
  video: Video,
  message: MessageCircle,
}

export function FormatBadge({ format, showIcon = true, size = 'md' }: FormatBadgeProps) {
  const config = MEETING_FORMAT_CONFIG[format]
  const Icon = ICONS[config.iconType]

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-1 text-xs'

  const iconSize = size === 'sm' ? 10 : 12

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${config.bgColor} ${config.textColor}
        ${sizeClasses}
      `}
    >
      {showIcon && <Icon className="shrink-0" size={iconSize} strokeWidth={1.5} />}
      <span>{config.label}</span>
    </span>
  )
}
