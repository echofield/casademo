'use client'

/**
 * SellerActivityRadar - Radar chart showing seller performance
 * All metrics are factual/trackable from database
 */

import { useMemo } from 'react'
import { Activity } from 'lucide-react'
import { clamp01 } from '@/lib/motion'

export interface SellerRadarData {
  name: string
  contacts: number      // Contacts made in last 7 days
  clients: number       // Total clients in portfolio
  ca: number            // Total spend of their clients (€)
  aJour: number         // % of clients NOT overdue (0-100)
}

interface SellerActivityRadarProps {
  sellers: SellerRadarData[]
  maxValues?: {
    contacts: number
    clients: number
    ca: number
  }
  className?: string
}

// 4-point radar - all metrics are real/trackable
const DIMENSIONS = [
  { key: 'contacts', label: 'Contacts (7j)', max: 15 },
  { key: 'clients', label: 'Clients', max: 50 },
  { key: 'ca', label: 'CA (k€)', max: 100000, divider: 1000 },
  { key: 'aJour', label: 'À jour (%)', max: 100 },
]

const COLORS = ['#1B4332', '#A38767', '#2F6B4F', '#6E685F']

export function SellerActivityRadar({ sellers, maxValues, className = '' }: SellerActivityRadarProps) {
  const size = 200
  const center = size / 2
  const maxRadius = 70

  // Dynamic max values based on actual data
  const effectiveMax = useMemo(() => ({
    contacts: maxValues?.contacts || Math.max(...sellers.map(s => s.contacts), 10),
    clients: maxValues?.clients || Math.max(...sellers.map(s => s.clients), 20),
    ca: maxValues?.ca || Math.max(...sellers.map(s => s.ca), 50000),
    aJour: 100,
  }), [sellers, maxValues])

  const angles = useMemo(
    () => Array.from({ length: 4 }, (_, i) => -Math.PI / 2 + (i * Math.PI * 2) / 4),
    []
  )

  const getPolygonPoints = (seller: SellerRadarData) => {
    const dims = [
      { value: seller.contacts, max: effectiveMax.contacts },
      { value: seller.clients, max: effectiveMax.clients },
      { value: seller.ca, max: effectiveMax.ca },
      { value: seller.aJour, max: 100 },
    ]
    return dims.map((dim, idx) => {
      const normalized = clamp01(dim.value / dim.max)
      const r = normalized * maxRadius
      const x = center + r * Math.cos(angles[idx])
      const y = center + r * Math.sin(angles[idx])
      return `${x},${y}`
    }).join(' ')
  }

  if (sellers.length === 0) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        style={{
          background: 'var(--paper)',
          border: '0.5px solid var(--faint)',
          borderRadius: '2px',
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="label text-text-muted">COMPARAISON VENDEURS</span>
          </div>
          <p className="text-sm text-text-muted text-center py-8">Aucune donnée disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
      }}
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">COMPARAISON VENDEURS</span>
        </div>

        <div className="flex items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px]">
            {/* Axis lines */}
            <g stroke="#1B4332" strokeWidth="0.5" strokeOpacity="0.12">
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
            <g stroke="#1B4332" strokeWidth="0.5" strokeOpacity="0.08" fill="none">
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
                fillOpacity={0.1}
                stroke={COLORS[idx]}
                strokeWidth={1.5}
                strokeOpacity={0.8}
                strokeLinejoin="round"
              />
            ))}

            {/* Labels */}
            <g fontFamily="var(--font-sans)" fontSize="8" fill="#6E685F" textAnchor="middle">
              {['Contacts', 'Clients', 'CA', 'À jour'].map((label, idx) => {
                const labelRadius = maxRadius + 16
                const x = center + labelRadius * Math.cos(angles[idx])
                const y = center + labelRadius * Math.sin(angles[idx])
                return (
                  <text key={label} x={x} y={y} dy="0.35em">
                    {label}
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

        {/* Mini stats under legend */}
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-[10px]" style={{ borderColor: 'var(--faint)' }}>
          {sellers.slice(0, 4).map((seller, idx) => (
            <div key={seller.name} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
              <span className="text-text-muted truncate">{seller.name}:</span>
              <span className="text-text">{seller.contacts}c · {seller.clients}cl · {seller.aJour}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
