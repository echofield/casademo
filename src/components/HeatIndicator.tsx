'use client'

interface HeatIndicatorProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function HeatIndicator({ score, size = 'md', showLabel = true }: HeatIndicatorProps) {
  // Determine heat level
  const getHeatLevel = (s: number) => {
    if (s >= 80) return { label: 'Chaud', color: '#C34747', bg: 'rgba(195, 71, 71, 0.1)' }
    if (s >= 60) return { label: 'Tiède', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' }
    if (s >= 40) return { label: 'Normal', color: '#A38767', bg: 'rgba(163, 135, 103, 0.1)' }
    if (s >= 20) return { label: 'Frais', color: '#6E685F', bg: 'rgba(110, 104, 95, 0.1)' }
    return { label: 'Froid', color: '#4B5563', bg: 'rgba(75, 85, 99, 0.1)' }
  }

  const heat = getHeatLevel(score)

  const sizeConfig = {
    sm: { bar: 'h-1', width: 'w-16', text: 'text-[10px]' },
    md: { bar: 'h-1.5', width: 'w-20', text: 'text-xs' },
    lg: { bar: 'h-2', width: 'w-24', text: 'text-sm' },
  }

  const config = sizeConfig[size]

  return (
    <div className="flex items-center gap-2">
      {/* Bar */}
      <div
        className={`${config.width} ${config.bar} overflow-hidden rounded-full`}
        style={{ backgroundColor: 'var(--faint)' }}
      >
        <div
          className={`${config.bar} rounded-full transition-all duration-300`}
          style={{
            width: `${score}%`,
            backgroundColor: heat.color,
          }}
        />
      </div>
      {/* Label */}
      {showLabel && (
        <span
          className={`${config.text} font-medium`}
          style={{ color: heat.color }}
        >
          {heat.label}
        </span>
      )}
    </div>
  )
}
