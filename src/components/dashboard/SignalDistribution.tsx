'use client'

import Link from 'next/link'
import { CornerBrackets } from '../CornerBrackets'
import { SignalDiamond } from '../SignalDiamond'
import { ClientSignal, SIGNAL_CONFIG, SIGNAL_ORDER } from '@/lib/types'

interface SellerSignalData {
  seller_id: string
  seller_name: string
  signals: Record<ClientSignal | 'null', number>
  total: number
}

interface SignalDistributionProps {
  sellers: SellerSignalData[]
  className?: string
}

export function SignalDistribution({ sellers, className = '' }: SignalDistributionProps) {
  // Calculate max total for scaling
  const maxTotal = Math.max(...sellers.map(s => s.total), 1)

  return (
    <section
      className={`p-6 md:p-8 relative ${className}`}
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
      }}
    >
      <CornerBrackets size="md" opacity={0.3} />

      <div className="flex items-center gap-2 mb-6">
        <SignalDiamond signal="hot" size={16} />
        <span className="label text-text-muted">PORTFOLIO SIGNAL</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {SIGNAL_ORDER.map(signal => (
          <div key={signal} className="flex items-center gap-1.5">
            <SignalDiamond signal={signal} size={12} />
            <span className="text-xs text-text-muted">{SIGNAL_CONFIG[signal].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <SignalDiamond signal={null} size={12} />
          <span className="text-xs text-text-muted">Not assessed</span>
        </div>
      </div>

      {/* Seller bars */}
      <div className="space-y-5">
        {sellers.map(seller => {
          // Calculate percentages
          const getPercent = (count: number) => Math.round((count / seller.total) * 100)

          return (
            <div key={seller.seller_id}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-text">{seller.seller_name}</span>
                <span className="text-xs text-text-muted">{seller.total} clients</span>
              </div>

              {/* Stacked bar */}
              <div className="flex h-6 rounded overflow-hidden">
                {/* Very Hot (Locked) */}
                {seller.signals.very_hot > 0 && (
                  <Link
                    href={`/clients?seller=${seller.seller_id}&signal=very_hot`}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: `${getPercent(seller.signals.very_hot)}%`,
                      backgroundColor: '#FCEBEB',
                    }}
                    title={`${seller.signals.very_hot} Locked`}
                  >
                    {seller.signals.very_hot >= 2 && (
                      <span className="text-xs font-medium" style={{ color: '#A32D2D' }}>
                        {seller.signals.very_hot}
                      </span>
                    )}
                  </Link>
                )}

                {/* Hot (Strong) */}
                {seller.signals.hot > 0 && (
                  <Link
                    href={`/clients?seller=${seller.seller_id}&signal=hot`}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: `${getPercent(seller.signals.hot)}%`,
                      backgroundColor: '#FAECE7',
                    }}
                    title={`${seller.signals.hot} Strong`}
                  >
                    {seller.signals.hot >= 2 && (
                      <span className="text-xs font-medium" style={{ color: '#993C1D' }}>
                        {seller.signals.hot}
                      </span>
                    )}
                  </Link>
                )}

                {/* Warm (Open) */}
                {seller.signals.warm > 0 && (
                  <Link
                    href={`/clients?seller=${seller.seller_id}&signal=warm`}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: `${getPercent(seller.signals.warm)}%`,
                      backgroundColor: '#FAEEDA',
                    }}
                    title={`${seller.signals.warm} Open`}
                  >
                    {seller.signals.warm >= 2 && (
                      <span className="text-xs font-medium" style={{ color: '#854F0B' }}>
                        {seller.signals.warm}
                      </span>
                    )}
                  </Link>
                )}

                {/* Null (Not assessed) - in the middle */}
                {seller.signals.null > 0 && (
                  <Link
                    href={`/clients?seller=${seller.seller_id}&signal=null`}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: `${getPercent(seller.signals.null)}%`,
                      backgroundColor: '#F5F5F5',
                    }}
                    title={`${seller.signals.null} Not assessed`}
                  >
                    {seller.signals.null >= 3 && (
                      <span className="text-xs font-medium text-text-muted">
                        {seller.signals.null}
                      </span>
                    )}
                  </Link>
                )}

                {/* Cold (Low) */}
                {seller.signals.cold > 0 && (
                  <Link
                    href={`/clients?seller=${seller.seller_id}&signal=cold`}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: `${getPercent(seller.signals.cold)}%`,
                      backgroundColor: '#E6F1FB',
                    }}
                    title={`${seller.signals.cold} Low`}
                  >
                    {seller.signals.cold >= 2 && (
                      <span className="text-xs font-medium" style={{ color: '#185FA5' }}>
                        {seller.signals.cold}
                      </span>
                    )}
                  </Link>
                )}

                {/* Lost (Off) */}
                {seller.signals.lost > 0 && (
                  <Link
                    href={`/clients?seller=${seller.seller_id}&signal=lost`}
                    className="flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{
                      width: `${getPercent(seller.signals.lost)}%`,
                      backgroundColor: '#E8E8E8',
                    }}
                    title={`${seller.signals.lost} Off`}
                  >
                    {seller.signals.lost >= 2 && (
                      <span className="text-xs font-medium" style={{ color: '#5F5E5A' }}>
                        {seller.signals.lost}
                      </span>
                    )}
                  </Link>
                )}
              </div>

              {/* Summary line */}
              <div className="flex gap-3 mt-1 text-xs text-text-muted">
                {seller.signals.very_hot + seller.signals.hot > 0 && (
                  <span>
                    {getPercent(seller.signals.very_hot + seller.signals.hot)}% strong
                  </span>
                )}
                {seller.signals.null > 0 && (
                  <span className="text-gold">
                    {getPercent(seller.signals.null)}% unassessed
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
