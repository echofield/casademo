'use client'

import { useState } from 'react'
import { AlertCircle, Bell, Check } from 'lucide-react'

interface SellerAlert {
  id: string
  name: string
  type: 'inactive' | 'overdue'
  clientCount?: number
  overdueCount?: number
}

interface Props {
  alerts: SellerAlert[]
}

export function TeamAlerts({ alerts }: Props) {
  const [sending, setSending] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState<Record<string, boolean>>({})

  const handleNotify = async (sellerId: string, sellerName: string, type: 'inactive' | 'overdue') => {
    if (sending[sellerId] || sent[sellerId]) return

    setSending(prev => ({ ...prev, [sellerId]: true }))
    try {
      const message = type === 'inactive' 
        ? 'Please check your queue - no contacts logged this week.'
        : 'You have overdue clients that need attention.'

      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: sellerId,
          message,
        }),
      })

      setSent(prev => ({ ...prev, [sellerId]: true }))
      setTimeout(() => {
        setSent(prev => ({ ...prev, [sellerId]: false }))
      }, 3000)
    } catch (err) {
      console.error('Failed to notify:', err)
    } finally {
      setSending(prev => ({ ...prev, [sellerId]: false }))
    }
  }

  const handleNotifyAll = async () => {
    for (const alert of alerts) {
      if (!sent[alert.id]) {
        await handleNotify(alert.id, alert.name, alert.type)
      }
    }
  }

  if (alerts.length === 0) return null

  return (
    <section
      className="p-6 mb-8 relative"
      style={{
        background: 'rgba(163, 135, 103, 0.06)',
        border: '0.5px solid rgba(163, 135, 103, 0.25)',
        borderRadius: '2px',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-gold" strokeWidth={1.5} />
          <span className="label text-gold">TEAM ALERTS</span>
        </div>
        <button
          type="button"
          onClick={handleNotifyAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
        >
          <Bell className="w-3 h-3" />
          Notify All
        </button>
      </div>
      <div className="space-y-2">
        {alerts.map(alert => (
          <div key={`${alert.id}-${alert.type}`} className="flex items-center justify-between group">
            <p className="text-sm text-text">
              <strong>{alert.name}</strong>
              {alert.type === 'inactive' 
                ? ` — 0 contacts this week (${alert.clientCount} clients)`
                : ` — ${alert.overdueCount} clients overdue`
              }
            </p>
            <button
              type="button"
              onClick={() => handleNotify(alert.id, alert.name, alert.type)}
              disabled={sending[alert.id]}
              className={`p-1.5 rounded transition-all ${
                sent[alert.id]
                  ? 'text-primary bg-primary/10'
                  : 'text-text-muted hover:text-gold hover:bg-gold/10 opacity-0 group-hover:opacity-100'
              }`}
              title={sent[alert.id] ? 'Sent!' : `Notify ${alert.name}`}
            >
              {sent[alert.id] ? (
                <Check className="w-4 h-4" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
