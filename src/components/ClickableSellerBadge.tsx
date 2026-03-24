'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  sellerId: string
  sellerName: string
  clientId: string
  clientName: string
  isOverdue?: boolean
  daysOverdue?: number
  userRole?: 'seller' | 'supervisor'
  currentUserId?: string
}

export function ClickableSellerBadge({
  sellerId,
  sellerName,
  clientId,
  clientName,
  isOverdue = false,
  daysOverdue = 0,
  userRole = 'seller',
  currentUserId,
}: Props) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const isSupervisor = userRole === 'supervisor'
  const isOwnClient = currentUserId === sellerId
  const canNotify = isSupervisor && !isOwnClient

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!canNotify || sending || sent) return

    setSending(true)
    try {
      const supabase = createClient()
      await supabase.from('notifications').insert({
        user_id: sellerId,
        type: 'manual',
        title: `Follow up: ${clientName}`,
        message: isOverdue
          ? `This client is ${daysOverdue} days overdue. Please follow up.`
          : `Supervisor reminder to check in with this client.`,
        client_id: clientId,
      })
      setSent(true)
      // Reset after 3 seconds
      setTimeout(() => setSent(false), 3000)
    } catch (err) {
      console.error('Failed to notify:', err)
    } finally {
      setSending(false)
    }
  }

  if (!canNotify) {
    // Non-clickable display for sellers or own clients
    return <span className="text-text-muted">· {sellerName}</span>
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={sending}
      className={`inline-flex items-center gap-1 transition-colors ${
        sent
          ? 'text-primary'
          : 'text-text-muted hover:text-gold cursor-pointer'
      }`}
      title={sent ? 'Reminder sent!' : `Click to remind ${sellerName}`}
    >
      · {sellerName}
      {sent ? (
        <Check className="w-3 h-3 text-primary" />
      ) : (
        <Bell className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  )
}
