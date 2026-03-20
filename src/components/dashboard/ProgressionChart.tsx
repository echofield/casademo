'use client'

/**
 * ProgressionChart - Multi-axis line chart showing progression over time
 * EdTech/Arché style: breathing, alive, with subtle gradients
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts'
import { TrendingUp } from 'lucide-react'

interface DataPoint {
  month: string
  value: number
  target?: number
}

interface ProgressionChartProps {
  data: DataPoint[]
  title?: string
  className?: string
}

const defaultData: DataPoint[] = [
  { month: 'Jan', value: 65, target: 70 },
  { month: 'Fév', value: 68, target: 72 },
  { month: 'Mar', value: 72, target: 74 },
  { month: 'Avr', value: 75, target: 76 },
  { month: 'Mai', value: 78, target: 78 },
  { month: 'Juin', value: 82, target: 80 },
]

export function ProgressionChart({
  data = defaultData,
  title = 'Progression Multi-Axes',
  className = '',
}: ProgressionChartProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(252,250,246,0.95) 0%, rgba(247,244,238,0.98) 100%)',
        border: '1px solid rgba(28, 27, 25, 0.06)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Subtle gradient accent */}
      <div
        className="absolute top-0 left-0 w-1 h-full"
        style={{
          background: 'linear-gradient(180deg, #0D4A3A 0%, #2F6B4F 50%, #A48763 100%)',
        }}
      />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">{title.toUpperCase()}</span>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D4A3A" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0D4A3A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(28, 27, 25, 0.06)"
              vertical={true}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6E685F', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={{ stroke: 'rgba(28, 27, 25, 0.08)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6E685F', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(252,250,246,0.95)',
                border: '1px solid rgba(28, 27, 25, 0.08)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                borderRadius: '4px',
                backdropFilter: 'blur(8px)',
              }}
              labelStyle={{ color: '#1C1B19', fontWeight: 500 }}
            />
            {/* Target line - dashed */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="#A48763"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            {/* Main progression area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#0D4A3A"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={{
                fill: '#FCFAF6',
                stroke: '#0D4A3A',
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                fill: '#0D4A3A',
                stroke: '#FCFAF6',
                strokeWidth: 2,
                r: 6,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-6 justify-center mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-[10px] text-text-muted tracking-wide">Réalisé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gold" style={{ borderStyle: 'dashed' }} />
            <span className="text-[10px] text-text-muted tracking-wide">Objectif</span>
          </div>
        </div>
      </div>
    </div>
  )
}
