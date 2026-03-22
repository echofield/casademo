'use client'

import type { ClientOrigin } from '@/lib/types'

interface OriginBadgeProps {
  origin: ClientOrigin | null
  size?: 'sm' | 'md'
}

export function OriginBadge({ origin, size = 'sm' }: OriginBadgeProps) {
  if (!origin) return null

  const isFrench = origin === 'french'

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium uppercase tracking-wide ${sizeClasses[size]}`}
      style={{
        backgroundColor: isFrench ? 'rgba(27, 67, 50, 0.08)' : 'rgba(163, 135, 103, 0.12)',
        color: isFrench ? 'var(--green)' : 'var(--gold)',
        borderRadius: '2px',
      }}
    >
      {isFrench ? 'FR' : 'Étranger'}
    </span>
  )
}
