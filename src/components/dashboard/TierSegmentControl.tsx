'use client'

import { useState } from 'react'
import { TierBadge, CornerBrackets } from '@/components'
import { TIER_ORDER, TIER_LABELS, type ClientTier } from '@/lib/types'
import { HealthBar } from './ComplexionDots'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface SellerBreakdown {
  seller_id: string
  seller_name: string
  tiers: Record<ClientTier, number>
  total: number
}

interface Props {
  clientsByTier: Record<ClientTier, number>
  sellers: SellerBreakdown[]
}

const TIER_DESCRIPTIONS: Record<ClientTier, string> = {
  rainbow: 'Entry level',
  optimisto: '1 000 €+',
  kaizen: '2 500 €+',
  idealiste: '10 000 €+',
  diplomatico: '17 000 €+',
  grand_prix: '25 000 €+',
}

export function TierSegmentControl({ clientsByTier, sellers }: Props) {
  const [activeTier, setActiveTier] = useState<ClientTier | null>(null)
  const [hoveredTier, setHoveredTier] = useState<ClientTier | null>(null)

  const maxTierCount = Math.max(...Object.values(clientsByTier), 1)

  const filteredSellers = activeTier
    ? sellers
        .map(s => ({ ...s, filteredCount: s.tiers[activeTier] || 0 }))
        .filter(s => s.filteredCount > 0)
        .sort((a, b) => b.filteredCount - a.filteredCount)
    : null

  const handleTierClick = (tier: ClientTier) => {
    setActiveTier(activeTier === tier ? null : tier)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Tier Distribution */}
      <section
        className="p-6 md:p-8 relative"
        style={{
          background: 'var(--paper)',
          border: '0.5px solid var(--faint)',
          borderRadius: '2px',
        }}
      >
        <CornerBrackets size="md" opacity={0.3} />
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
          <span className="label text-text-muted">TIER DISTRIBUTION</span>
        </div>
        <div className="space-y-3">
          {TIER_ORDER.map((tier) => {
            const count = clientsByTier[tier]
            const isActive = activeTier === tier
            const isDimmed = activeTier !== null && !isActive

            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleTierClick(tier)}
                onMouseEnter={() => setHoveredTier(tier)}
                onMouseLeave={() => setHoveredTier(null)}
                className={`w-full flex items-center gap-4 py-1.5 px-2 -mx-2 rounded-sm transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-[#003D2B]/[0.06]'
                    : isDimmed
                      ? 'opacity-40'
                      : 'hover:bg-[#003D2B]/[0.03]'
                }`}
              >
                <div className="w-28 shrink-0">
                  <TierBadge tier={tier} />
                </div>
                <div className="flex-1">
                  <HealthBar
                    value={count}
                    max={maxTierCount}
                    variant="good"
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-serif text-lg text-text">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Hover tooltip */}
        {hoveredTier && !activeTier && (
          <div
            className="mt-4 pt-3 text-xs text-text-muted"
            style={{ borderTop: '0.5px solid var(--faint)' }}
          >
            <span className="font-medium text-text">{TIER_LABELS[hoveredTier]}</span>
            <span className="mx-1.5">·</span>
            {TIER_DESCRIPTIONS[hoveredTier]}
          </div>
        )}

        {/* Active tier info + CTA */}
        {activeTier && (
          <div
            className="mt-5 pt-4 flex items-center justify-between"
            style={{ borderTop: '0.5px solid var(--faint)' }}
          >
            <div className="text-xs text-text-muted">
              <span className="font-medium text-text">{TIER_LABELS[activeTier]}</span>
              <span className="mx-1.5">·</span>
              {TIER_DESCRIPTIONS[activeTier]}
              <span className="mx-1.5">·</span>
              {clientsByTier[activeTier]} client{clientsByTier[activeTier] !== 1 ? 's' : ''}
            </div>
            <Link
              href={`/clients?tier=${activeTier}`}
              className="label text-xs text-primary hover:text-primary-soft transition-colors"
            >
              View clients →
            </Link>
          </div>
        )}
      </section>

      {/* Seller Breakdown — filtered by active tier */}
      <section
        className="p-6 relative overflow-hidden"
        style={{
          background: 'var(--paper)',
          border: '0.5px solid var(--faint)',
          borderRadius: '2px',
        }}
      >
        <CornerBrackets size="md" opacity={0.3} />
        <div className="flex items-center justify-between mb-4">
          <span className="label text-text-muted">
            {activeTier
              ? `${TIER_LABELS[activeTier].toUpperCase()} BY SELLER`
              : 'BREAKDOWN BY SELLER'
            }
          </span>
          {activeTier && (
            <button
              type="button"
              onClick={() => setActiveTier(null)}
              className="label text-xs text-text-muted hover:text-text transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Filtered view */}
        {filteredSellers ? (
          filteredSellers.length > 0 ? (
            <div className="space-y-3">
              {filteredSellers.map((seller) => (
                <div
                  key={seller.seller_id}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '0.5px solid var(--faint)' }}
                >
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
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-lg text-text">{seller.filteredCount}</span>
                    <span className="text-xs text-text-muted">
                      / {seller.total}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted text-sm mt-4">No sellers have {TIER_LABELS[activeTier!]} clients.</p>
          )
        ) : (
          /* Default: full breakdown */
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
                <div className="flex flex-wrap gap-2 ml-12">
                  {TIER_ORDER.map((tier) => {
                    const count = seller.tiers[tier] || 0
                    if (count === 0) return null
                    return (
                      <div key={tier} className="flex items-center gap-1">
                        <TierBadge tier={tier} size="sm" />
                        <span className="text-xs text-text-muted">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
