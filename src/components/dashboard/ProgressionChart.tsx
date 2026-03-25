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
  { month: 'Feb', value: 68, target: 72 },
  { month: 'Mar', value: 72, target: 74 },
  { month: 'Apr', value: 75, target: 76 },
  { month: 'May', value: 78, target: 78 },
  { month: 'Jun', value: 82, target: 80 },
]

export function ProgressionChart({
  data = defaultData,
  title = 'Progression Multi-Axes',
  className = '',
}: ProgressionChartProps) {
  const hasData = data.some(d => d.value > 0)

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
      }}
    >
      {/* SYMI-style gradient accent */}
      <div
        className="absolute top-0 left-0 w-0.5 h-full"
        style={{
          background: 'linear-gradient(180deg, #1B4332 0%, #2F6B4F 50%, #A38767 100%)',
        }}
      />

      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">{title.toUpperCase()}</span>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[240px] text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: 'rgba(27, 67, 50, 0.06)' }}>
              <TrendingUp className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
            <p className="font-serif text-lg text-text">No contacts logged yet</p>
            <p className="text-xs text-text-muted mt-1 max-w-[220px]">
              Start logging contacts and this chart will track your team&apos;s monthly reach rate.
            </p>
          </div>
        ) : (<>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1B4332" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--faint)"
              vertical={true}
            />
            <XAxis
              dataKey="month"
              tick={{ fill: '#6E685F', fontSize: 11, fontFamily: 'var(--font-sans)' }}
              axisLine={{ stroke: 'var(--faint)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6E685F', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--paper)',
                border: '0.5px solid var(--faint)',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                borderRadius: '2px',
                boxShadow: '0 8px 40px rgba(27, 67, 50, 0.04)',
              }}
              labelStyle={{ color: 'var(--ink)', fontWeight: 500 }}
              formatter={(value, name) => [
                `${value}%`,
                name === 'value' ? 'Contacted' : 'Goal'
              ]}
            />
            {/* Target line - dashed */}
            <Line
              type="monotone"
              dataKey="target"
              stroke="#A38767"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
            {/* Main progression area */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#1B4332"
              strokeWidth={2}
              fill="url(#colorValue)"
              dot={{
                fill: 'var(--paper)',
                stroke: '#1B4332',
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                fill: '#1B4332',
                stroke: 'var(--paper)',
                strokeWidth: 2,
                r: 6,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex gap-6 justify-center mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-primary" />
            <span className="text-[10px] text-text-muted tracking-wide">Contacted %</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gold" style={{ borderStyle: 'dashed' }} />
            <span className="text-[10px] text-text-muted tracking-wide">Monthly Goal</span>
          </div>
        </div>
        </>)}
      </div>
    </div>
  )
}
