'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()
      const { error } = await supabase.from('notifications').insert({
        user_id: sellerId,
        type: 'manual',
        title: `Follow up with ${clientName}`,
        message: `Supervisor reminder: Please check in with this client.`,
        client_id: clientId,
      })
      if (error) {
        console.error('Failed to notify:', error)
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
