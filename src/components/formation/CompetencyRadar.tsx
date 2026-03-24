'use client'

/**
 * CompetencyRadar - Aura hexagon-style radar chart
 * Animated SVG polygon showing 6-dimensional competency mapping
 * Casa One aesthetic: forest green, warm grays, subtle motion
 */

import { useMemo, useState, useEffect, useRef } from 'react'
import { clamp01, interpolate, durations } from '@/lib/motion'

interface CompetencyField {
  technical: number      // 0-1
  soft_skills: number
  methodology: number
  autonomy: number
  collaboration: number
  adaptability: number
}

interface CompetencyRadarProps {
  field: CompetencyField
  className?: string
}

const AXIS_CONFIG = [
  { key: 'technical', label: 'Technique' },
  { key: 'soft_skills', label: 'Soft Skills' },
  { key: 'methodology', label: 'Méthodologie' },
  { key: 'autonomy', label: 'Autonomie' },
  { key: 'collaboration', label: 'Collaboration' },
  { key: 'adaptability', label: 'Adaptabilité' },
] as const

function useAnimatedField(target: CompetencyField, durationMs = durations.measured * 1.5): CompetencyField {
  const [displayed, setDisplayed] = useState<CompetencyField>(target)
  const prevRef = useRef<CompetencyField>(target)

  useEffect(() => {
    const start = prevRef.current
    const startTime = performance.now()

    let frameId = 0
    const tick = (now: number) => {
      let progress = (now - startTime) / durationMs
      if (progress >= 1) progress = 1

      const ease = interpolate('transition', progress)

      setDisplayed({
        technical: start.technical + (target.technical - start.technical) * ease,
        soft_skills: start.soft_skills + (target.soft_skills - start.soft_skills) * ease,
        methodology: start.methodology + (target.methodology - start.methodology) * ease,
        autonomy: start.autonomy + (target.autonomy - start.autonomy) * ease,
        collaboration: start.collaboration + (target.collaboration - start.collaboration) * ease,
        adaptability: start.adaptability + (target.adaptability - start.adaptability) * ease,
      })

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        prevRef.current = target
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [target, durationMs])

  return displayed
}

export function CompetencyRadar({ field, className = '' }: CompetencyRadarProps) {
  const animated = useAnimatedField(field)

  const size = 220
  const center = size / 2
  const maxRadius = 85
  const angles = useMemo(
    () => Array.from({ length: 6 }, (_, i) => -Math.PI / 2 + (i * Math.PI * 2) / 6),
    []
  )

  const values = [
    animated.technical,
    animated.soft_skills,
    animated.methodology,
    animated.autonomy,
    animated.collaboration,
    animated.adaptability,
  ]

  const polygonPoints = values
    .map((v, idx) => {
      const r = clamp01(v) * maxRadius
      const x = center + r * Math.cos(angles[idx])
      const y = center + r * Math.sin(angles[idx])
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div
      className={`bg-surface p-6 ${className}`}
      style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
    >
      <div className="label text-text-muted mb-4">COMPETENCY MAP</div>

      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px] mx-auto block">
        {/* Axis lines */}
        <g stroke="#0D4A3A" strokeWidth="0.6" strokeOpacity="0.14">
          {angles.map((angle, i) => (
            <line
              key={`axis-${i}`}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(angle)}
              y2={center + maxRadius * Math.sin(angle)}
            />
          ))}
        </g>

        {/* Web rings */}
        <g stroke="#0D4A3A" strokeWidth="0.5" strokeOpacity="0.1" fill="none">
          {[0.25, 0.5, 0.75, 1].map((rPct) => (
            <polygon
              key={`web-${rPct}`}
              points={angles
                .map((a) => {
                  const r = rPct * maxRadius
                  return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
                })
                .join(' ')}
            />
          ))}
        </g>

        {/* Data polygon */}
        <polygon
          points={polygonPoints}
          fill="#0D4A3A"
          fillOpacity="0.08"
          stroke="#0D4A3A"
          strokeWidth="1.5"
          strokeOpacity="0.7"
          strokeLinejoin="round"
        />

        {/* Data points */}
        <g fill="#0D4A3A" fillOpacity="0.85">
          {values.map((v, idx) => {
            const r = clamp01(v) * maxRadius
            const x = center + r * Math.cos(angles[idx])
            const y = center + r * Math.sin(angles[idx])
            return <circle key={`node-${idx}`} cx={x} cy={y} r="2" />
          })}
        </g>

        {/* Labels */}
        <g fontFamily="var(--font-sans)" fontSize="9" fill="#6E685F" textAnchor="middle">
          {AXIS_CONFIG.map((axis, idx) => {
            const labelRadius = maxRadius + 18
            const x = center + labelRadius * Math.cos(angles[idx])
            const y = center + labelRadius * Math.sin(angles[idx])
            return (
              <text key={axis.key} x={x} y={y} dy="0.35em">
                {axis.label}
              </text>
            )
          })}
        </g>
      </svg>

      {/* Axis detail grid */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {AXIS_CONFIG.map((axis) => {
          const value = field[axis.key as keyof CompetencyField]
          const status = value > 0.7 ? 'acquis' : value > 0.4 ? 'en cours' : 'à développer'
          return (
            <div
              key={axis.key}
              className="py-2 px-3"
              style={{
                border: '1px solid rgba(28, 27, 25, 0.06)',
                background: 'rgba(28, 27, 25, 0.02)',
              }}
            >
              <div className="text-[10px] text-text-muted tracking-wide">{axis.label}</div>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-sm font-medium text-primary">{Math.round(value * 100)}%</span>
                <span className="text-[10px] text-text-muted">{status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
