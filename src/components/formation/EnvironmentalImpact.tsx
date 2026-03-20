'use client'

/**
 * EnvironmentalImpact - Donut chart showing CO2 impact by training modality
 * Casa One aesthetic: forest green, gold, warm grays
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

const data = [
  { name: '100% Digital', value: 65, color: '#0D4A3A', impact: '-45% CO₂' },
  { name: 'Hybride', value: 25, color: '#A48763', impact: '-25% CO₂' },
  { name: 'Présentiel', value: 10, color: '#6E685F', impact: 'Base' },
]

interface EnvironmentalImpactProps {
  className?: string
}

export function EnvironmentalImpact({ className = '' }: EnvironmentalImpactProps) {
  return (
    <div
      className={`bg-surface p-6 ${className}`}
      style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
    >
      <div className="label text-text-muted mb-4">IMPACT ENVIRONNEMENTAL</div>

      <div className="flex items-center gap-6">
        <ResponsiveContainer width="50%" height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-text-soft">{item.name}</span>
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: item.impact.includes('-') ? '#2F6B4F' : '#6E685F' }}
              >
                {item.impact}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stat */}
      <div
        className="mt-4 pt-4 text-center"
        style={{ borderTop: '1px solid rgba(28, 27, 25, 0.06)' }}
      >
        <p className="text-[10px] text-text-muted tracking-wide uppercase mb-1">
          Économie totale estimée
        </p>
        <p className="metric-small text-success">-38% CO₂</p>
      </div>
    </div>
  )
}
