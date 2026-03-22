'use client'

import { TierBadge, CornerBrackets } from '@/components'
import { TIER_ORDER, type ClientTier } from '@/lib/types'

interface SellerBreakdown {
  seller_id: string
  seller_name: string
  tiers: Record<ClientTier, number>
  total: number
}

interface SellerTierBreakdownProps {
  sellers: SellerBreakdown[]
  className?: string
}

export function SellerTierBreakdown({ sellers, className = '' }: SellerTierBreakdownProps) {
  if (sellers.length === 0) {
    return (
      <div
        className={`p-6 relative ${className}`}
        style={{
          background: 'var(--paper)',
          border: '0.5px solid var(--faint)',
          borderRadius: '2px',
        }}
      >
        <span className="label text-text-muted">BREAKDOWN BY SELLER</span>
        <p className="text-text-muted mt-4">No active sellers</p>
      </div>
    )
  }

  return (
    <div
      className={`p-6 relative overflow-hidden ${className}`}
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
      }}
    >
      <CornerBrackets size="md" opacity={0.3} />
      <span className="label text-text-muted mb-4 block">BREAKDOWN BY SELLER</span>

      <div className="space-y-4">
        {sellers.map((seller) => (
          <div
            key={seller.seller_id}
            className="pb-4"
            style={{ borderBottom: '0.5px solid var(--faint)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 flex items-center justify-center font-serif text-base"
                  style={{
                    backgroundColor: 'var(--green-soft)',
                    color: 'var(--green)',
                    borderRadius: '2px',
                  }}
                >
                  {seller.seller_name.charAt(0)}
                </div>
                <span className="font-serif text-text">{seller.seller_name}</span>
              </div>
              <span className="text-sm text-text-muted">{seller.total} clients</span>
            </div>

            {/* Tier breakdown as mini badges */}
            <div className="flex flex-wrap gap-2 ml-12">
              {TIER_ORDER.map((tier) => {
                const count = seller.tiers[tier] || 0
                if (count === 0) return null
                return (
                  <div key={tier} className="flex items-center gap-1">
                    <TierBadge tier={tier} size="sm" />
                    <span className="text-xs text-text-muted">×{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
