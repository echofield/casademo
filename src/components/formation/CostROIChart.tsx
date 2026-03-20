'use client'

/**
 * CostROIChart - Bar chart comparing cost vs ROI by training modality
 * Casa One aesthetic: forest green, gold, warm grays
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const data = [
  { name: 'E-Learning', cost: 85, roi: 190 },
  { name: 'Présentiel', cost: 180, roi: 120 },
  { name: 'Hybride', cost: 120, roi: 165 },
]

interface CostROIChartProps {
  className?: string
}

export function CostROIChart({ className = '' }: CostROIChartProps) {
  return (
    <div
      className={`bg-surface p-6 ${className}`}
      style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
    >
      <div className="label text-text-muted mb-4">COÛT VS ROI PAR MODALITÉ</div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barGap={8}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(28, 27, 25, 0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6E685F', fontSize: 11, fontFamily: 'var(--font-sans)' }}
            axisLine={{ stroke: 'rgba(28, 27, 25, 0.08)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6E685F', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FCFAF6',
              border: '1px solid rgba(28, 27, 25, 0.08)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              borderRadius: 0,
            }}
            labelStyle={{ color: '#1C1B19', fontWeight: 500 }}
          />
          <Legend
            wrapperStyle={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          />
          <Bar
            dataKey="cost"
            name="Coût (k€)"
            fill="#C34747"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="roi"
            name="ROI (%)"
            fill="#0D4A3A"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
