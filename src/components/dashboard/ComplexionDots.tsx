'use client'

/**
 * ComplexionDots - Visual health/rhythm indicator
 * Shows state as filled/empty dots (●●●○○○)
 * More humane than raw numbers
 */

import { useMemo } from 'react'

interface ComplexionDotsProps {
  /** Current value */
  value: number
  /** Maximum value for scaling */
  max: number
  /** Number of dots to display */
  dots?: number
  /** Color when filled */
  color?: string
  /** Whether higher is better or worse */
  inverted?: boolean
  /** Size of each dot */
  size?: 'sm' | 'md' | 'lg'
  /** Show the numeric value alongside */
  showValue?: boolean
  className?: string
}

export function ComplexionDots({
  value,
  max,
  dots = 6,
  color = '#0D4A3A',
  inverted = false,
  size = 'md',
  showValue = false,
  className = '',
}: ComplexionDotsProps) {
  const filled = useMemo(() => {
    const normalized = Math.min(value / max, 1)
    return Math.round(normalized * dots)
  }, [value, max, dots])

  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  }

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  }

  // Determine color based on inverted logic
  // For inverted (e.g., overdue): more filled = worse
  const getColor = (index: number, isFilled: boolean) => {
    if (!isFilled) return 'rgba(28, 27, 25, 0.1)'

    if (inverted) {
      // Red gradient for bad metrics
      const intensity = index / dots
      if (intensity > 0.66) return '#C34747'
      if (intensity > 0.33) return '#D97706'
      return color
    }

    return color
  }

  return (
    <div className={`flex items-center ${gapClasses[size]} ${className}`}>
      {Array.from({ length: dots }).map((_, i) => {
        const isFilled = i < filled
        const dotColor = getColor(i, isFilled)

        return (
          <div
            key={i}
            className={`${sizeClasses[size]} rounded-full transition-all duration-300`}
            style={{
              backgroundColor: dotColor,
              opacity: isFilled ? 1 : 0.3,
            }}
          />
        )
      })}
      {showValue && (
        <span
          className="ml-2 text-xs font-medium"
          style={{ color: inverted && filled > dots * 0.5 ? '#C34747' : 'inherit' }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

/**
 * RhythmIndicator - Shows rhythm health with pulsing effect
 */
interface RhythmIndicatorProps {
  /** Activity level 0-1 */
  activity: number
  /** Label for the indicator */
  label?: string
  className?: string
}

export function RhythmIndicator({
  activity,
  label,
  className = '',
}: RhythmIndicatorProps) {
  const pulseIntensity = Math.max(0.3, activity)

  // Map activity to descriptive state
  const state = activity > 0.7 ? 'active' : activity > 0.3 ? 'moderate' : 'quiet'
  const stateColors = {
    active: '#0D4A3A',
    moderate: '#A48763',
    quiet: '#6E685F',
  }
  const stateLabels = {
    active: 'Actif',
    moderate: 'Modéré',
    quiet: 'Calme',
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        {/* Outer pulse ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            backgroundColor: stateColors[state],
            opacity: pulseIntensity * 0.2,
            transform: `scale(${1 + pulseIntensity * 0.3})`,
            transition: 'all 1s ease-out',
          }}
        />
        {/* Core dot */}
        <div
          className="w-3 h-3 rounded-full relative z-10"
          style={{
            backgroundColor: stateColors[state],
          }}
        />
      </div>
      {label && (
        <span className="text-xs text-text-muted">
          {label || stateLabels[state]}
        </span>
      )}
    </div>
  )
}

/**
 * HealthBar - Horizontal fill bar with gradient
 */
interface HealthBarProps {
  value: number
  max: number
  label?: string
  /** Good or warning state */
  variant?: 'good' | 'warning' | 'neutral'
  className?: string
}

export function HealthBar({
  value,
  max,
  label,
  variant = 'neutral',
  className = '',
}: HealthBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  const gradients = {
    good: 'linear-gradient(90deg, #0D4A3A 0%, #2F6B4F 100%)',
    warning: 'linear-gradient(90deg, #D97706 0%, #C34747 100%)',
    neutral: 'linear-gradient(90deg, #6E685F 0%, #A48763 100%)',
  }

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-text-muted">{label}</span>
          <span className="text-xs font-medium text-text">{value}</span>
        </div>
      )}
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(28, 27, 25, 0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            background: gradients[variant],
          }}
        />
      </div>
    </div>
  )
}
