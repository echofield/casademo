'use client'

/**
 * SellerActivityRadar - Radar chart showing seller performance dimensions
 * Arché style: hexagonal, breathing, instrument-like
 */

import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { clamp01 } from '@/lib/motion'

interface SellerData {
  name: string
  contacts: number
  conversions: number
  followUps: number
  responsiveness: number
  clientSatisfaction: number
}

interface SellerActivityRadarProps {
  sellers: SellerData[]
  className?: string
}

const DIMENSIONS = [
  { key: 'contacts', label: 'Contacts', max: 20 },
  { key: 'conversions', label: 'Conversions', max: 10 },
  { key: 'followUps', label: 'Suivis', max: 15 },
  { key: 'responsiveness', label: 'Réactivité', max: 100 },
  { key: 'clientSatisfaction', label: 'Satisfaction', max: 100 },
]

const COLORS = ['#0D4A3A', '#A48763', '#2F6B4F', '#6E685F']

export function SellerActivityRadar({ sellers, className = '' }: SellerActivityRadarProps) {
  const size = 200
  const center = size / 2
  const maxRadius = 75

  const angles = useMemo(
    () => Array.from({ length: 5 }, (_, i) => -Math.PI / 2 + (i * Math.PI * 2) / 5),
    []
  )

  const getPolygonPoints = (seller: SellerData) => {
    return DIMENSIONS.map((dim, idx) => {
      const value = seller[dim.key as keyof SellerData] as number
      const normalized = clamp01(value / dim.max)
      const r = normalized * maxRadius
      const x = center + r * Math.cos(angles[idx])
      const y = center + r * Math.sin(angles[idx])
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(252,250,246,0.95) 0%, rgba(247,244,238,0.98) 100%)',
        border: '1px solid rgba(28, 27, 25, 0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">ACTIVITÉ PAR VENDEUR</span>
        </div>

        <div className="flex items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px]">
            {/* Axis lines */}
            <g stroke="#0D4A3A" strokeWidth="0.5" strokeOpacity="0.12">
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
            <g stroke="#0D4A3A" strokeWidth="0.5" strokeOpacity="0.08" fill="none">
              {[0.25, 0.5, 0.75, 1].map((rPct) => (
                <polygon
                  key={`web-${rPct}`}
                  points={angles.map((a) => {
                    const r = rPct * maxRadius
                    return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
                  }).join(' ')}
                />
              ))}
            </g>

            {/* Seller polygons */}
            {sellers.slice(0, 4).map((seller, idx) => (
              <polygon
                key={seller.name}
                points={getPolygonPoints(seller)}
                fill={COLORS[idx]}
                fillOpacity={0.08}
                stroke={COLORS[idx]}
                strokeWidth={1.5}
                strokeOpacity={0.7}
                strokeLinejoin="round"
              />
            ))}

            {/* Labels */}
            <g fontFamily="var(--font-sans)" fontSize="8" fill="#6E685F" textAnchor="middle">
              {DIMENSIONS.map((dim, idx) => {
                const labelRadius = maxRadius + 14
                const x = center + labelRadius * Math.cos(angles[idx])
                const y = center + labelRadius * Math.sin(angles[idx])
                return (
                  <text key={dim.key} x={x} y={y} dy="0.35em">
                    {dim.label}
                  </text>
                )
              })}
            </g>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {sellers.slice(0, 4).map((seller, idx) => (
            <div key={seller.name} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: COLORS[idx] }}
              />
              <span className="text-[10px] text-text-muted">{seller.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
