'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { tierBorders } from '@/lib/motion'
import { ClickableSellerBadge } from './ClickableSellerBadge'
import { SignalBadge } from './SignalBadge'
import { InterestTag } from './InterestTag'
import type { ClientTier, ClientSignal, InterestItem } from '@/lib/types'
import { isDemoMode } from '@/lib/demo/config'

interface Props {
  client: {
    id: string
    first_name: string
    last_name: string
    tier: ClientTier
    phone: string | null
    total_spend: number
    days_overdue: number | null
    seller_id: string
    seller_name: string
    lastContactLabel: string
    nextContactLabel: string
    seller_signal?: ClientSignal | null
    signal_note?: string | null
    interests?: InterestItem[] | null
    locale?: string | null
  }
  userRole?: 'seller' | 'supervisor'
  currentUserId?: string
  onMarkedDone?: (clientId: string, remainingCount?: number) => void
}

export function FocusedClientCard({ client, userRole = 'seller', currentUserId, onMarkedDone }: Props) {
  const router = useRouter()
  const isOverdue = (client.days_overdue ?? 0) > 0
  const isPremium = ['grand_prix', 'diplomatico'].includes(client.tier)
  const isSupervisor = userRole === 'supervisor'
  const isOwnClient = currentUserId === client.seller_id
  const canNotifySeller = isSupervisor && !isOwnClient && !isDemoMode

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const tierLabel = client.tier.replace('_', ' ').toUpperCase()
  const borderColor = tierBorders[client.tier] || tierBorders.rainbow

  // Get top 3 interests for display
  const topInterests = client.interests?.slice(0, 3) || []

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (client.phone) {
      window.location.href = `sms:${client.phone}`
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (client.phone) {
      const cleaned = client.phone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleaned}`, '_blank')
    }
  }

  const handleCardClick = () => {
    router.push(`/clients/${client.id}`)
  }

  const [notifying, setNotifying] = useState(false)
  const [notified, setNotified] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [doneLocked, setDoneLocked] = useState(false)

  const handleNotifySeller = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notifying || notified) return

    setNotifying(true)
    const clientFullName = `${client.first_name} ${client.last_name}`
    const tierDisplay = client.tier.replace('_', ' ')
    const daysText = client.days_overdue === 1 ? '1 day' : `${client.days_overdue} days`

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: client.seller_id,
          client_id: client.id,
          client_name: clientFullName,
          message: `${clientFullName} (${tierDisplay}) is ${daysText} overdue. Please follow up.`,
        }),
      })

      if (res.ok) {
        setNotified(true)
        toast.success(`Reminder sent to ${client.seller_name} about ${clientFullName}`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to send reminder')
      }
    } catch (err) {
      console.error('Failed to notify seller:', err)
      toast.error('Failed to send reminder')
    } finally {
      setNotifying(false)
    }
  }

  const handleMarkDone = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (markingDone) return
    setMarkingDone(true)

    try {
      const res = await fetch(`/api/clients/${client.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'other',
          comment: 'Follow-up completed',
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to mark as done')
      }

      const payload = await res.json().catch(() => ({}))
      if (payload?.already_done) {
        setDoneLocked(true)
        onMarkedDone?.(client.id, payload?.seller_remaining_count)
        toast.success(`${client.first_name} already marked done today`)
        return
      }

      // Reconcile immediately with the server-derived remaining count.
      setDoneLocked(true)
      onMarkedDone?.(client.id, payload?.seller_remaining_count)
      toast.success(`${client.first_name} removed from queue`)
    } catch (err) {
      console.error('Failed to mark done:', err)
      toast.error('Could not mark as done')
    } finally {
      setMarkingDone(false)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className="cursor-pointer bg-surface transition-all duration-200 hover:bg-bg-soft active:scale-[0.99]"
      style={{
        border: '1px solid rgba(28, 27, 25, 0.08)',
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
      }}
    >
      <div className="p-8 md:p-10">
        <div className="mb-6">
          <h2 className="mb-2 font-serif text-3xl tracking-tight text-text md:text-4xl">
            {client.first_name} {client.last_name}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <span className="label" style={{ color: borderColor, letterSpacing: '0.15em' }}>
              {tierLabel}
            </span>
            <SignalBadge signal={client.seller_signal ?? null} size="sm" />
            {client.locale === 'foreign' && (
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                Foreign
              </span>
            )}
            <span className="text-xs">
              <ClickableSellerBadge
                sellerId={client.seller_id}
                sellerName={client.seller_name}
                clientId={client.id}
                clientName={`${client.first_name} ${client.last_name}`}
                isOverdue={isOverdue}
                daysOverdue={client.days_overdue ?? 0}
                userRole={userRole}
                currentUserId={currentUserId}
              />
            </span>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-baseline gap-6">
          {client.phone && <span className="body text-text-muted">{client.phone}</span>}
          <span className={`text-xl font-medium ${isPremium ? 'text-gold' : 'text-text'}`}>
            {formatCurrency(client.total_spend)}
          </span>
        </div>

        {/* Interest tags */}
        {topInterests.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            {topInterests.map((interest) => (
              <InterestTag
                key={interest.id}
                category={interest.category}
                value={interest.value}
                clickable={false} // Prevent navigation from card click
                size="sm"
              />
            ))}
          </div>
        )}

        <div className="mb-10 flex gap-10">
          <div>
            <p className="label mb-2 text-text-muted">Last contact</p>
            <p className="body-small text-text">{client.lastContactLabel}</p>
          </div>
          <div>
            <p className="label mb-2 text-text-muted">Due</p>
            <p className={`body-small ${isOverdue ? 'font-medium text-danger' : 'text-text'}`}>
              {isOverdue ? `+${client.days_overdue} days` : client.nextContactLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canNotifySeller ? (
            /* Supervisor viewing another seller's client - show notify button */
            <button
              type="button"
              onClick={handleNotifySeller}
              disabled={notifying || notified}
              className={`flex-1 py-4 text-xs font-medium uppercase tracking-[0.12em] transition-colors duration-200 sm:min-w-[160px] ${
                notified
                  ? 'bg-primary/20 text-primary cursor-default'
                  : 'bg-gold text-white hover:bg-gold/90'
              }`}
            >
              {notified ? 'Reminder sent' : notifying ? 'Sending...' : `Remind ${client.seller_name.split(' ')[0]}`}
            </button>
          ) : (
            /* Seller or supervisor viewing own client - show contact buttons */
            client.phone && (
              <>
                <button
                  type="button"
                  onClick={handleCall}
                  className="flex-1 bg-primary py-4 text-xs font-medium uppercase tracking-[0.12em] text-white transition-all duration-200 hover:bg-primary-soft active:scale-[0.98] sm:min-w-[160px]"
                >
                  Message {client.first_name}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center border border-primary/25 px-6 py-4 text-primary transition-all duration-200 hover:bg-primary-soft/30 active:scale-[0.98]"
                  title="WhatsApp"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </button>
              </>
            )
          )}
          <Link
            href={`/clients/${client.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center border px-6 py-4 text-xs font-medium uppercase tracking-[0.12em] text-text-muted transition-all duration-200 hover:border-text hover:text-text active:scale-[0.98]"
            style={{ borderColor: 'rgba(28, 27, 25, 0.14)' }}
          >
            Full profile
          </Link>
          {!isDemoMode && (isOwnClient || !isSupervisor) && (
            <button
              type="button"
              onClick={handleMarkDone}
              disabled={markingDone || doneLocked}
              className="flex items-center justify-center border px-6 py-4 text-xs font-medium uppercase tracking-[0.12em] text-primary transition-all duration-200 hover:border-primary hover:bg-primary/5 active:scale-[0.98] disabled:opacity-50"
              style={{ borderColor: 'rgba(27, 67, 50, 0.28)' }}
            >
              {doneLocked ? 'Done' : markingDone ? 'Marking...' : 'Mark as done'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


