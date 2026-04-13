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
      <div className="border bg-surface p-5" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#003D2B]" strokeWidth={1.5} />
          <span className="label text-text-muted">MY IMPACT THIS MONTH</span>
        </div>
        <div className="space-y-3">
          <div className="skeleton-block h-9 w-40" />
          <div className="skeleton-block h-3 w-32" />
        </div>
      </div>
    )
  }

  if (!data || (data.crm_sales === 0 && data.total_sales === 0)) {
    return null
  }

  return (
    <div className="border bg-surface p-5" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-[#003D2B]" strokeWidth={1.5} />
        <span className="label text-text-muted">MY IMPACT THIS MONTH</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-serif text-2xl text-[#003D2B]">{data.crm_sales}</span>
        <span className="text-sm text-text-muted">CRM sales</span>
        <span className="mx-1 text-text-muted">·</span>
        <span className="font-serif text-2xl text-[#003D2B]">{formatCurrency(data.crm_revenue)}</span>
        <span className="text-sm text-text-muted">revenue</span>
      </div>
      {data.total_sales > 0 && (
        <p className="mt-2 text-xs text-text-muted">
          {data.crm_pct}% of your sales from Casa One recontact
        </p>
      )}
    </div>
  )
}
