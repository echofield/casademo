'use client'

import { useState, useEffect } from 'react'
import { CornerBrackets } from '@/components'
import { PURCHASE_SOURCES, PURCHASE_SOURCE_COLORS, getPurchaseSourceLabel, PurchaseSource } from '@/lib/types'

interface SourceBreakdown {
  source: string
  count: number
  revenue: number
  avg_basket: number
  pct_of_total: number
}

interface SellerBreakdown {
  seller_id: string
  seller_name: string
  total_sales: number
  crm_sales: number
  crm_pct: number
  crm_revenue: number
}

interface SignalBreakdown {
  signal: string | null
  client_count: number
  sales_count: number
  conversion_pct: number
  avg_basket: number
}

interface ConversionTotals {
  total_revenue: number
  crm_revenue: number
  total_sales: number
  crm_sales: number
  conversion_rate: number
  avg_crm_basket: number
}

interface ConversionData {
  period: 'week' | 'month' | 'all'
  by_source: SourceBreakdown[]
  by_seller: SellerBreakdown[]
  by_signal: SignalBreakdown[]
  totals: ConversionTotals
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const SIGNAL_LABELS: Record<string, string> = {
  'very_hot': 'Locked',
  'hot': 'Strong',
  'warm': 'Open',
  'cold': 'Low',
  'lost': 'Off',
  'null': 'Not assessed',
}

const SIGNAL_GLYPHS: Record<string, string> = {
  'very_hot': String.fromCodePoint(0x25C6) + String.fromCodePoint(0x2726),
  'hot': String.fromCodePoint(0x25C6),
  'warm': String.fromCodePoint(0x25C7) + String.fromCodePoint(0x25C6),
  'cold': String.fromCodePoint(0x25C7),
  'lost': String.fromCodePoint(0x25C7) + String.fromCodePoint(0x0338),
  'null': '—',
}

export function ConversionMetrics({ className = '' }: { className?: string }) {
  const [data, setData] = useState<ConversionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/conversion?period=${period}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to fetch conversion data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-64 bg-[#003D2B]/5 rounded" />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { totals, by_source, by_seller, by_signal } = data

  return (
    <section className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="label text-text-muted">CASA ONE IMPACT</span>
          <h2 className="font-serif text-2xl text-text mt-1">Conversion tracking</h2>
        </div>
        <div className="flex gap-1">
          {(['week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                period === p
                  ? 'bg-[#003D2B] text-white'
                  : 'bg-transparent text-text-muted hover:text-text border border-[rgba(28,27,25,0.12)]'
              }`}
            >
              {p === 'week' ? 'This week' : p === 'month' ? 'This month' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      {/* Top metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard
          label="CRM revenue"
          value={formatCurrency(totals.crm_revenue)}
          variant="primary"
        />
        <MetricCard
          label="Conversion rate"
          value={`${totals.conversion_rate}%`}
          subtext="of sales from CRM"
          variant={totals.conversion_rate >= 30 ? 'good' : totals.conversion_rate >= 15 ? 'neutral' : 'warning'}
        />
        <MetricCard
          label="CRM sales"
          value={totals.crm_sales}
          subtext="this period"
        />
        <MetricCard
          label="Total revenue"
          value={formatCurrency(totals.total_revenue)}
        />
        <MetricCard
          label="Total sales"
          value={totals.total_sales}
        />
        <MetricCard
          label="Avg CRM basket"
          value={formatCurrency(totals.avg_crm_basket)}
        />
      </div>

      {/* Two column layout for tables */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Source breakdown */}
        <div
          className="p-6 relative"
          style={{
            background: 'var(--paper)',
            border: '0.5px solid var(--faint)',
            borderRadius: '2px',
          }}
        >
          <CornerBrackets size="md" opacity={0.3} />
          <span className="label text-text-muted mb-4 block">BY SOURCE</span>
          {by_source.length === 0 ? (
            <p className="text-sm text-text-muted">No sales data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b" style={{ borderColor: 'var(--faint)' }}>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium text-right">Sales</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                  <th className="pb-2 font-medium text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {by_source.map((row) => {
                  const colors = PURCHASE_SOURCE_COLORS[row.source as PurchaseSource]
                  return (
                    <tr key={row.source} className="border-b last:border-0" style={{ borderColor: 'var(--faint)' }}>
                      <td className="py-2">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${colors?.bg || 'bg-gray-50'} ${colors?.text || 'text-gray-500'}`}>
                          {getPurchaseSourceLabel(row.source)}
                        </span>
                      </td>
                      <td className="py-2 text-right font-serif">{row.count}</td>
                      <td className="py-2 text-right font-serif">{formatCurrency(row.revenue)}</td>
                      <td className="py-2 text-right text-text-muted">{row.pct_of_total}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Seller breakdown */}
        <div
          className="p-6 relative"
          style={{
            background: 'var(--paper)',
            border: '0.5px solid var(--faint)',
            borderRadius: '2px',
          }}
        >
          <CornerBrackets size="md" opacity={0.3} />
          <span className="label text-text-muted mb-4 block">BY SELLER</span>
          {by_seller.length === 0 ? (
            <p className="text-sm text-text-muted">No sales data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b" style={{ borderColor: 'var(--faint)' }}>
                  <th className="pb-2 font-medium">Seller</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                  <th className="pb-2 font-medium text-right">CRM</th>
                  <th className="pb-2 font-medium text-right">CRM %</th>
                  <th className="pb-2 font-medium text-right">CRM rev</th>
                </tr>
              </thead>
              <tbody>
                {by_seller.map((row) => (
                  <tr key={row.seller_id} className="border-b last:border-0" style={{ borderColor: 'var(--faint)' }}>
                    <td className="py-2 font-medium text-text">{row.seller_name.split(' ')[0]}</td>
                    <td className="py-2 text-right">{row.total_sales}</td>
                    <td className="py-2 text-right font-serif text-[#003D2B]">{row.crm_sales}</td>
                    <td className="py-2 text-right">
                      <span className={row.crm_pct >= 30 ? 'text-[#003D2B] font-medium' : row.crm_pct >= 15 ? 'text-text' : 'text-text-muted'}>
                        {row.crm_pct}%
                      </span>
                    </td>
                    <td className="py-2 text-right font-serif">{formatCurrency(row.crm_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Signal conversion - the killer metric */}
      <div
        className="p-6 relative"
        style={{
          background: 'var(--paper)',
          border: '0.5px solid var(--faint)',
          borderRadius: '2px',
        }}
      >
        <CornerBrackets size="md" opacity={0.3} />
        <div className="mb-4">
          <span className="label text-text-muted">CONVERSION BY SIGNAL</span>
          <p className="text-xs text-text-muted mt-1">
            This proves signal assessment = money. High-signal clients convert at higher rates.
          </p>
        </div>
        {by_signal.length === 0 ? (
          <p className="text-sm text-text-muted">No data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b" style={{ borderColor: 'var(--faint)' }}>
                <th className="pb-2 font-medium">Signal</th>
                <th className="pb-2 font-medium text-right">Clients</th>
                <th className="pb-2 font-medium text-right">Sales</th>
                <th className="pb-2 font-medium text-right">Conv %</th>
                <th className="pb-2 font-medium text-right">Avg basket</th>
              </tr>
            </thead>
            <tbody>
              {by_signal.map((row) => {
                const signalKey = row.signal || 'null'
                return (
                  <tr key={signalKey} className="border-b last:border-0" style={{ borderColor: 'var(--faint)' }}>
                    <td className="py-2">
                      <span className="font-medium text-text">
                        {SIGNAL_GLYPHS[signalKey]} {SIGNAL_LABELS[signalKey]}
                      </span>
                    </td>
                    <td className="py-2 text-right">{row.client_count}</td>
                    <td className="py-2 text-right font-serif">{row.sales_count}</td>
                    <td className="py-2 text-right">
                      <span className={row.conversion_pct >= 50 ? 'text-[#003D2B] font-bold' : row.conversion_pct >= 20 ? 'text-[#003D2B] font-medium' : row.conversion_pct >= 5 ? 'text-text' : 'text-text-muted'}>
                        {row.conversion_pct}%
                      </span>
                    </td>
                    <td className="py-2 text-right font-serif">{formatCurrency(row.avg_basket)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function MetricCard({
  label,
  value,
  subtext,
  variant = 'neutral',
}: {
  label: string
  value: string | number
  subtext?: string
  variant?: 'neutral' | 'primary' | 'good' | 'warning'
}) {
  const colors = {
    neutral: { bg: 'rgba(26, 26, 26, 0.03)', text: 'var(--ink)' },
    primary: { bg: 'rgba(0, 61, 43, 0.08)', text: '#003D2B' },
    good: { bg: 'rgba(27, 67, 50, 0.08)', text: 'var(--green)' },
    warning: { bg: 'rgba(217, 119, 6, 0.08)', text: '#D97706' },
  }

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: colors[variant].bg,
        borderRadius: '2px',
      }}
    >
      <span className="text-[10px] tracking-wide text-text-muted uppercase block mb-1">{label}</span>
      <div
        className="font-serif text-xl"
        style={{ color: colors[variant].text }}
      >
        {value}
      </div>
      {subtext && (
        <span className="text-[10px] text-text-muted">{subtext}</span>
      )}
    </div>
  )
}
