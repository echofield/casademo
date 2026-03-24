'use client'

import Link from 'next/link'
import { SignalDiamond } from '@/components'
import { SIGNAL_CONFIG, SIGNAL_ORDER } from '@/lib/types/signal'
import type { ClientSignal } from '@/lib/types/signal'

interface SellerSignalData {
  seller_id: string
  seller_name: string
  signals: Record<ClientSignal | 'null', number>
  total: number
}

interface Props {
  sellers: SellerSignalData[]
  className?: string
}

const COLUMNS: { key: ClientSignal | 'null'; label: string; signal: ClientSignal | null }[] = [
  { key: 'very_hot', label: 'Locked', signal: 'very_hot' },
  { key: 'hot', label: 'Strong', signal: 'hot' },
  { key: 'warm', label: 'Open', signal: 'warm' },
  { key: 'cold', label: 'Low', signal: 'cold' },
  { key: 'lost', label: 'Off', signal: 'lost' },
  { key: 'null', label: 'N/A', signal: null },
]

function CellLink({ sellerId, signal, count, isNA }: {
  sellerId: string
  signal: ClientSignal | 'null'
  count: number
  isNA?: boolean
}) {
  if (count === 0) {
    return <span className="text-text-muted/30">0</span>
  }

  const signalParam = signal === 'null' ? 'null' : signal
  const colorClass = isNA
    ? 'text-text-muted'
    : signal !== 'null' && SIGNAL_CONFIG[signal]
    ? ''
    : 'text-text'

  return (
    <Link
      href={`/clients?seller=${sellerId}&signal=${signalParam}`}
      className={`font-medium hover:underline ${colorClass}`}
      style={!isNA && signal !== 'null' ? { color: SIGNAL_CONFIG[signal].color } : undefined}
    >
      {count}
    </Link>
  )
}

export function SignalMatrix({ sellers, className = '' }: Props) {
  if (sellers.length === 0) return null

  const totals: Record<ClientSignal | 'null', number> = {
    very_hot: 0, hot: 0, warm: 0, cold: 0, lost: 0, null: 0,
  }
  let grandTotal = 0

  sellers.forEach(s => {
    COLUMNS.forEach(col => {
      totals[col.key] += s.signals[col.key] || 0
    })
    grandTotal += s.total
  })

  const unassessedPct = grandTotal > 0 ? Math.round((totals.null / grandTotal) * 100) : 0
  const showWarning = unassessedPct > 50

  return (
    <section className={`border bg-surface p-6 md:p-8 ${className}`} style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      <p className="label mb-2 text-text-muted">Signal overview</p>
      <h2 className="mb-6 font-serif text-2xl text-text">Portfolio intent across the team</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
              <th className="pb-3 pr-4 text-left font-medium text-text-muted" />
              {COLUMNS.map(col => (
                <th key={col.key} className="pb-3 px-2 text-center font-medium text-text-muted">
                  <div className="flex flex-col items-center gap-1">
                    <SignalDiamond signal={col.signal} size={12} />
                    <span className="text-xs">{col.label}</span>
                  </div>
                </th>
              ))}
              <th className="pb-3 pl-2 text-center font-medium text-text-muted text-xs">Total</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map(seller => {
              const sellerUnassessedPct = seller.total > 0
                ? Math.round((seller.signals.null / seller.total) * 100)
                : 0
              const sellerWarning = sellerUnassessedPct > 50

              return (
                <tr
                  key={seller.seller_id}
                  className="border-b last:border-0"
                  style={{ borderColor: 'rgba(28, 27, 25, 0.06)' }}
                >
                  <td className="py-3 pr-4 text-left">
                    <span className="font-medium text-text">{seller.seller_name.split(' ')[0]}</span>
                  </td>
                  {COLUMNS.map(col => (
                    <td key={col.key} className={`py-3 px-2 text-center ${col.key === 'null' && sellerWarning ? 'bg-amber-50/50' : ''}`}>
                      <CellLink
                        sellerId={seller.seller_id}
                        signal={col.key}
                        count={seller.signals[col.key] || 0}
                        isNA={col.key === 'null'}
                      />
                    </td>
                  ))}
                  <td className="py-3 pl-2 text-center text-text-muted">{seller.total}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2" style={{ borderColor: 'rgba(28, 27, 25, 0.15)' }}>
              <td className="py-3 pr-4 text-left font-medium text-text-muted text-xs uppercase tracking-wider">Total</td>
              {COLUMNS.map(col => (
                <td key={col.key} className={`py-3 px-2 text-center font-medium ${col.key === 'null' && showWarning ? 'bg-amber-50/50' : ''}`}>
                  <span
                    className={col.key === 'null' ? 'text-text-muted' : ''}
                    style={col.key !== 'null' && SIGNAL_CONFIG[col.key] ? { color: SIGNAL_CONFIG[col.key].color } : undefined}
                  >
                    {totals[col.key]}
                  </span>
                </td>
              ))}
              <td className="py-3 pl-2 text-center font-medium text-text">{grandTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {showWarning && (
        <div className="mt-4 flex items-center gap-2 rounded bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <span className="font-medium">Attention:</span>
          <span>{totals.null} clients not assessed ({unassessedPct}%)</span>
        </div>
      )}
    </section>
  )
}
