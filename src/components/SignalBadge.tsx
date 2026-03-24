'use client'

import { ClientSignal, getSignalConfig } from '@/lib/types/signal'
import { SignalDiamond } from './SignalDiamond'

interface SignalBadgeProps {
  signal: ClientSignal | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onClick?: () => void
}

/**
 * SignalBadge — Pill badge showing signal diamond + label
 *
 * Displays the client's purchase intent signal as a colored pill
 * with the diamond glyph and text label.
 */
export function SignalBadge({
  signal,
  size = 'sm',
  showLabel = true,
  onClick,
}: SignalBadgeProps) {
  const config = getSignalConfig(signal)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  const diamondSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  const baseClasses = `
    inline-flex items-center rounded-full border
    ${config.bgClass} ${config.textClass} ${config.borderClass}
    ${sizeClasses[size]}
    transition-colors duration-150
  `

  const clickableClasses = onClick
    ? 'cursor-pointer hover:opacity-80'
    : ''

  const content = (
    <>
      <SignalDiamond signal={signal} size={diamondSizes[size]} />
      {showLabel && (
        <span className="font-medium">{config.label}</span>
      )}
    </>
  )

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${clickableClasses}`}
      >
        {content}
      </button>
    )
  }

  return (
    <span className={baseClasses}>
      {content}
    </span>
  )
}
