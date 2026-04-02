'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'

interface Props {
  clientId: string
  sellerId: string
  sellerName: string
  clientName: string
}

export function NotifySellerButton({ clientId, sellerId, sellerName, clientName }: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleNotify = async () => {
    if (sending || sent) return
    setSending(true)

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seller_id: sellerId,
          client_id: clientId,
          client_name: clientName,
          message: 'Supervisor reminder: Please check in with this client.',
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        console.error('Failed to notify:', payload)
        return
      }

      setSent(true)
    } catch (err) {
      console.error('Failed to notify:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleNotify}
      disabled={sending || sent}
      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors ${
        sent
          ? 'bg-primary/10 text-primary cursor-default'
          : 'bg-gold/10 text-gold hover:bg-gold/20'
      }`}
      title={sent ? 'Reminder sent' : `Remind ${sellerName}`}
    >
      {sent ? (
        <>
          <Check className="w-4 h-4" />
          Sent
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" />
          {sending ? 'Sending...' : `Remind ${sellerName.split(' ')[0]}`}
        </>
      )}
    </button>
  )
}
