'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'

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
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: sellerId,
          client_id: clientId,
          client_name: clientName,
          message: isOverdue
            ? `This client is ${daysOverdue} days overdue. Please follow up.`
            : `Supervisor reminder to check in with this client.`,
        }),
      })

      if (response.ok) {
        setSent(true)
        setTimeout(() => setSent(false), 3000)
      } else {
        console.error('Failed to notify:', await response.text())
      }
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
