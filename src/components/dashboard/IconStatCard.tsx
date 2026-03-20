'use client'

/**
 * IconStatCard - Glassmorphism stat card with icon and trend
 * EdTech/Arché style: soft gradients, breathing feel
 */

import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface IconStatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subtext?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  accentColor?: string
  className?: string
}

export function IconStatCard({
  icon,
  label,
  value,
  subtext,
  trend,
  trendValue,
  accentColor = '#0D4A3A',
  className = '',
}: IconStatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? '#2F6B4F' : trend === 'down' ? '#C34747' : '#6E685F'

  return (
    <div
      className={`relative overflow-hidden p-5 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(252,250,246,0.98) 0%, rgba(247,244,238,0.95) 100%)',
        border: '1px solid rgba(28, 27, 25, 0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Accent gradient corner */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${accentColor} 0%, transparent 70%)`,
        }}
      />

      {/* Trend indicator bar */}
      {trend && (
        <div
          className="absolute top-0 right-0 w-1 h-full"
          style={{ backgroundColor: trendColor, opacity: 0.6 }}
        />
      )}

      <div className="relative">
        {/* Header with icon */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}10` }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
          <span className="text-xs text-text-muted tracking-wide">{label}</span>
        </div>

        {/* Value */}
        <div className="metric text-text">{value}</div>

        {/* Subtext and trend */}
        <div className="flex items-center justify-between mt-2">
          {subtext && (
            <span className="text-xs text-text-muted">{subtext}</span>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1" style={{ color: trendColor }}>
              <TrendIcon className="w-3 h-3" />
              <span className="text-xs font-medium">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
