'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { tierBorders } from '@/lib/motion'
import { createClient } from '@/lib/supabase/client'
import { ClickableSellerBadge } from './ClickableSellerBadge'
import type { ClientTier } from '@/lib/types'

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
  }
  userRole?: 'seller' | 'supervisor'
  currentUserId?: string
  onNext?: () => void
}

export function FocusedClientCard({ client, userRole = 'seller', currentUserId }: Props) {
  const router = useRouter()
  const isOverdue = (client.days_overdue ?? 0) > 0
  const isPremium = ['grand_prix', 'diplomatico'].includes(client.tier)
  const isSupervisor = userRole === 'supervisor'
  const isOwnClient = currentUserId === client.seller_id

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const tierLabel = client.tier.replace('_', ' ').toUpperCase()
  const borderColor = tierBorders[client.tier] || tierBorders.rainbow

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (client.phone) {
      window.location.href = `tel:${client.phone}`
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

  const handleNotifySeller = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notifying || notified) return

    setNotifying(true)
    try {
      const supabase = createClient()
      await supabase.from('notifications').insert({
        user_id: client.seller_id,
        type: 'client_overdue',
        title: `Relancer ${client.first_name} ${client.last_name}`,
        message: `Ce client est en retard de ${client.days_overdue} jour${(client.days_overdue ?? 0) > 1 ? 's' : ''}.`,
        client_id: client.id,
      })
      setNotified(true)
    } catch (err) {
      console.error('Failed to notify seller:', err)
    } finally {
      setNotifying(false)
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
      className="cursor-pointer bg-surface transition-colors duration-200 hover:bg-bg-soft"
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
          <div className="flex items-center gap-3">
            <span className="label" style={{ color: borderColor, letterSpacing: '0.15em' }}>
              {tierLabel}
            </span>
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
          {isSupervisor && !isOwnClient ? (
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
                  className="flex-1 bg-primary py-4 text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-200 hover:bg-primary-soft sm:min-w-[160px]"
                >
                  Call {client.first_name}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="flex items-center justify-center border border-primary/25 px-6 py-4 text-primary transition-colors duration-200 hover:bg-primary-soft/30"
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
            className="flex items-center justify-center border px-6 py-4 text-xs font-medium uppercase tracking-[0.12em] text-text-muted transition-colors duration-200 hover:border-text hover:text-text"
            style={{ borderColor: 'rgba(28, 27, 25, 0.14)' }}
          >
            Full profile
          </Link>
        </div>
      </div>
    </div>
  )
}
