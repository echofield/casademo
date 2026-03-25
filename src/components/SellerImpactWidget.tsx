'use client'

import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'

interface ImpactData {
  crm_sales: number
  crm_revenue: number
  total_sales: number
  crm_pct: number
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function SellerImpactWidget({ sellerId }: { sellerId: string }) {
  const [data, setData] = useState<ImpactData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/seller/impact')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (err) {
        console.error('Failed to fetch impact data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [sellerId])

  if (loading) {
    return (
      <div
        className="border bg-surface p-5 animate-pulse"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
      >
        <div className="h-16 bg-[#003D2B]/5 rounded" />
      </div>
    )
  }

  if (!data || (data.crm_sales === 0 && data.total_sales === 0)) {
    return null
  }

  return (
    <div
      className="border bg-surface p-5"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-[#003D2B]" strokeWidth={1.5} />
        <span className="label text-text-muted">MY IMPACT THIS MONTH</span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-serif text-2xl text-[#003D2B]">{data.crm_sales}</span>
        <span className="text-sm text-text-muted">CRM sales</span>
        <span className="text-text-muted mx-1">·</span>
        <span className="font-serif text-2xl text-[#003D2B]">{formatCurrency(data.crm_revenue)}</span>
        <span className="text-sm text-text-muted">revenue</span>
      </div>
      {data.total_sales > 0 && (
        <p className="text-xs text-text-muted mt-2">
          {data.crm_pct}% of your sales from Casa One recontact
        </p>
      )}
    </div>
  )
}
