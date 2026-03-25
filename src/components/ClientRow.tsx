'use client'

import { useRouter } from 'next/navigation'
import { TierBadge } from './TierBadge'

interface ClientRowProps {
  client: {
    id: string
    first_name: string
    last_name: string
    phone: string | null
    tier: string
    total_spend: number
    last_contact_date: string | null
    next_recontact_date: string | null
    days_overdue?: number
  }
  showOverdue?: boolean
  lastContactLabel?: string
  nextContactLabel?: string
}

export function ClientRow({
  client,
  showOverdue = false,
  lastContactLabel,
  nextContactLabel
}: ClientRowProps) {
  const router = useRouter()
  const isOverdue = showOverdue && (client.days_overdue ?? 0) > 0
  const isHighValue = ['grand_prix', 'diplomatico'].includes(client.tier)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const handleClick = () => {
    router.push(`/clients/${client.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (client.phone) {
      // Strip all non-digits for wa.me URL (WhatsApp requires: +33612345678 → 33612345678)
      const cleanPhone = client.phone.replace(/\D/g, '')
      window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        py-5 px-4 cursor-pointer
        flex flex-col md:flex-row md:items-center md:justify-between gap-4
        transition-colors duration-200
        hover:bg-bg-soft
        ${isOverdue ? 'border-l-[3px] border-l-danger pl-3' : ''}
      `}
      style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}
    >
      {/* Left: Identity */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="table-value text-text truncate">
            {client.first_name} {client.last_name}
          </span>
          <TierBadge tier={client.tier} />
        </div>

        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            onClick={handlePhoneClick}
            className="mt-1 text-sm text-text-muted hover:text-primary transition-colors"
          >
            {client.phone}
          </a>
        )}
      </div>

      {/* Center: Dates */}
      <div className="flex items-center gap-8 text-sm">
        <div className="flex flex-col">
          <span className="text-text-muted text-xs uppercase tracking-wide">Last</span>
          <span className="text-text-soft">
            {lastContactLabel || formatDate(client.last_contact_date)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-text-muted text-xs uppercase tracking-wide">Next</span>
          <span className={isOverdue ? 'text-danger font-medium' : 'text-text-soft'}>
            {nextContactLabel || formatDate(client.next_recontact_date)}
            {isOverdue && client.days_overdue && (
              <span className="ml-1 text-danger">
                (+{client.days_overdue}d)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Right: Value + Action */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <span className={`table-value ${isHighValue ? 'text-gold' : 'text-text'}`}>
            {formatCurrency(client.total_spend)}
          </span>
        </div>

        {client.phone && (
          <button
            onClick={handleWhatsAppClick}
            className="btn-ghost text-xs flex items-center gap-1"
            aria-label="Contact on WhatsApp"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span className="hidden md:inline">WhatsApp</span>
          </button>
        )}
      </div>
    </div>
  )
}
