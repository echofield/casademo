'use client'

/**
 * LearningMomentum - Aura wave-style animated line
 * Shows learning momentum as a breathing, living visualization
 * Uses simplex noise for organic movement (fallback if d3-shape unavailable)
 * Casa One aesthetic: forest green, subtle, calm animation
 */

import { useEffect, useState, useMemo, useRef } from 'react'
import { clamp01, prefersReducedMotion } from '@/lib/motion'

interface MomentumData {
  engagement: number    // 0-1
  progress: number      // 0-1
  consistency: number   // 0-1
}

interface LearningMomentumProps {
  data: MomentumData
  className?: string
}

// Simple noise function (avoids d3-shape dependency)
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

function createNoise(seed: number) {
  const rand = seededRandom(seed)
  const perm = Array.from({ length: 256 }, () => Math.floor(rand() * 256))

  return (x: number, y: number): number => {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)

    const u = xf * xf * (3 - 2 * xf)
    const v = yf * yf * (3 - 2 * yf)

    const aa = perm[(perm[xi] + yi) & 255]
    const ab = perm[(perm[xi] + yi + 1) & 255]
    const ba = perm[(perm[(xi + 1) & 255] + yi) & 255]
    const bb = perm[(perm[(xi + 1) & 255] + yi + 1) & 255]

    const x1 = aa * (1 - u) + ba * u
    const x2 = ab * (1 - u) + bb * u

    return ((x1 * (1 - v) + x2 * v) / 255 - 0.5) * 2
  }
}

function createWavePath(
  width: number,
  height: number,
  phase: number,
  data: MomentumData,
  noise: (x: number, y: number) => number
): string {
  const centerY = height / 2
  const pointsCount = 40
  const points: string[] = []

  const amp = 3 + data.engagement * 10 + data.consistency * 5
  const frequency = 1.2 + data.progress * 1
  const damping = 0.5 + data.consistency * 0.4

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount
    const x = t * width

    // Edge mask - smooth fade at edges
    const edgeMask = Math.pow(Math.sin(Math.PI * t), 1.3)

    // Primary sine wave
    const sine = Math.sin(t * Math.PI * 2 * frequency + phase)

    // Organic noise layer
    const organic = noise(t * 2.5, phase * 0.2) * 0.5

    const y = centerY + (sine * damping + organic) * amp * edgeMask

    if (i === 0) {
      points.push(`M ${x},${y}`)
    } else {
      points.push(`L ${x},${y}`)
    }
  }

  return points.join(' ')
}

function getMomentumLabel(data: MomentumData): string {
  const avg = (data.engagement + data.progress + data.consistency) / 3
  if (avg > 0.75) return 'Dynamique excellente'
  if (avg > 0.55) return 'Progression régulière'
  if (avg > 0.35) return 'Momentum en construction'
  return 'Phase de démarrage'
}

export function LearningMomentum({ data, className = '' }: LearningMomentumProps) {
  const [phase, setPhase] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(360)
  const noiseRef = useRef(createNoise(42))
  const reducedMotion = prefersReducedMotion()

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Animate phase
  useEffect(() => {
    if (reducedMotion) return

    const timer = setInterval(() => {
      setPhase((p) => p + 0.05)
    }, 140)
    return () => clearInterval(timer)
  }, [reducedMotion])

  const wavePath = useMemo(
    () => createWavePath(width, 40, phase, data, noiseRef.current),
    [width, phase, data]
  )

  const ghostPath = useMemo(
    () => createWavePath(width, 40, phase - 0.3, {
      engagement: data.engagement * 0.6,
      progress: data.progress * 0.6,
      consistency: data.consistency * 0.6,
    }, noiseRef.current),
    [width, phase, data]
  )

  const momentumLabel = getMomentumLabel(data)

  return (
    <div
      ref={containerRef}
      className={`bg-surface p-6 ${className}`}
      style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
    >
      <div className="label text-text-muted mb-4">MOMENTUM D'APPRENTISSAGE</div>

      <svg
        viewBox={`0 0 ${width} 40`}
        preserveAspectRatio="none"
        className="w-full h-10 block"
        style={{ opacity: 0.75 }}
      >
        {/* Ghost line */}
        <path
          d={ghostPath}
          fill="none"
          stroke="rgba(13, 74, 58, 0.12)"
          strokeWidth={1}
          strokeDasharray="4 5"
          strokeLinecap="round"
        />
        {/* Main line */}
        <path
          d={wavePath}
          fill="none"
          stroke="#0D4A3A"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeOpacity={0.65}
        />
      </svg>

      <p className="text-center mt-4 text-sm" style={{ color: '#6E685F' }}>
        {momentumLabel}
      </p>

      {/* Metrics row */}
      <div className="flex justify-center gap-6 mt-3">
        <div className="text-center">
          <div className="text-[10px] text-text-muted tracking-wide">Engagement</div>
          <div className="text-sm font-medium text-primary">{Math.round(data.engagement * 100)}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-text-muted tracking-wide">Progression</div>
          <div className="text-sm font-medium text-primary">{Math.round(data.progress * 100)}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-text-muted tracking-wide">Régularité</div>
          <div className="text-sm font-medium text-primary">{Math.round(data.consistency * 100)}%</div>
        </div>
      </div>
    </div>
  )
}
