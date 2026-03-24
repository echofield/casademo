'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { CornerBrackets, TierBadge } from '@/components'
import type { ClientTier } from '@/lib/types'

interface Props {
  seller: {
    id: string
    name: string
    clientCount: number
    contactsWeek: number
    overdueCount: number
    totalSpend: number
    aJourPct: number
    tiers: Record<ClientTier, number>
  }
  tierOrder: ClientTier[]
}

export function SellerCard({ seller, tierOrder }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleNotify = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (sending || sent) return

    setSending(true)
    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: seller.id,
          message: 'Please check your queue',
        }),
      })
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      console.error('Failed to notify:', err)
    } finally {
      setSending(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k€`
    return `${amount}€`
  }

  return (
    <div
      className="p-5 relative group"
      style={{
        background: 'var(--paper)',
        border: '0.5px solid var(--faint)',
        borderRadius: '2px',
      }}
    >
      <CornerBrackets size="sm" opacity={0.2} />

      {/* Header with name and actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 flex items-center justify-center font-serif text-lg"
            style={{
              backgroundColor: 'var(--green-soft)',
              color: 'var(--green)',
              borderRadius: '2px',
            }}
          >
            {seller.name.charAt(0)}
          </div>
          <div>
            <p className="font-serif text-text">{seller.name}</p>
            <p className="text-xs text-text-muted">{seller.clientCount} clients</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNotify}
            disabled={sending}
            className={`p-2 rounded transition-all ${
              sent
                ? 'text-primary bg-primary/10'
                : 'text-text-muted hover:text-gold hover:bg-gold/10 opacity-0 group-hover:opacity-100'
            }`}
            title={sent ? 'Sent!' : `Notify ${seller.name}`}
          >
            {sent ? <Check className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          </button>
          <Link
            href={`/clients?seller=${seller.id}`}
            className="p-2 text-text-muted hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            title="View clients"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="text-[10px] text-text-muted uppercase">Contacts</p>
          <p className="font-serif text-lg text-text">{seller.contactsWeek}</p>
          <p className="text-[9px] text-text-muted">this week</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase">Overdue</p>
          <p className={`font-serif text-lg ${seller.overdueCount > 0 ? 'text-danger' : 'text-primary'}`}>
            {seller.overdueCount}
          </p>
          <p className="text-[9px] text-text-muted">clients</p>
        </div>
        <div>
          <p className="text-[10px] text-text-muted uppercase">Revenue</p>
          <p className="font-serif text-lg text-gold">{formatCurrency(seller.totalSpend)}</p>
          <p className="text-[9px] text-text-muted">total</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-text-muted uppercase">Portfolio up to date</p>
          <span className={`text-xs font-medium ${seller.aJourPct >= 80 ? 'text-primary' : seller.aJourPct >= 50 ? 'text-gold' : 'text-danger'}`}>
            {seller.aJourPct}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--faint)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${seller.aJourPct}%`,
              backgroundColor: seller.aJourPct >= 80 ? 'var(--green)' : seller.aJourPct >= 50 ? 'var(--gold)' : 'var(--danger)',
            }}
          />
        </div>
      </div>

      {/* Tier breakdown - clickable */}
      {seller.clientCount > 0 && (
        <div className="flex flex-wrap gap-1">
          {tierOrder.map(tier => {
            const count = seller.tiers[tier]
            if (count === 0) return null
            return (
              <Link
                key={tier}
                href={`/clients?seller=${seller.id}&tier=${tier}`}
                className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 hover:opacity-70 transition-opacity"
                style={{
                  backgroundColor: 'var(--faint)',
                  borderRadius: '2px',
                }}
              >
                <TierBadge tier={tier} />
                <span>{count}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
