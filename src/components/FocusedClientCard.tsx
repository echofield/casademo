'use client'

import { useRouter } from 'next/navigation'
import { tierBorders } from '@/lib/motion'
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
    lastContactLabel: string
    nextContactLabel: string
  }
  onNext?: () => void
}

export function FocusedClientCard({ client, onNext }: Props) {
  const router = useRouter()
  const isOverdue = (client.days_overdue ?? 0) > 0
  const isPremium = ['grand_prix', 'diplomatico'].includes(client.tier)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
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
      const cleaned = client.phone.replace(/\s/g, '')
      window.open(`https://wa.me/${cleaned}`, '_blank')
    }
  }

  const handleCardClick = () => {
    router.push(`/clients/${client.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-surface cursor-pointer transition-colors duration-150 hover:bg-[#F9F7F3]"
      style={{
        borderLeft: `4px solid ${borderColor}`,
        border: '1px solid rgba(28, 27, 25, 0.08)',
        borderLeftWidth: '4px',
        borderLeftColor: borderColor,
      }}
    >
      {/* Main content */}
      <div className="p-8 md:p-10">
        {/* Name and tier */}
        <div className="mb-6">
          <h2 className="font-serif text-3xl md:text-4xl text-text tracking-tight mb-2">
            {client.first_name} {client.last_name}
          </h2>
          <span
            className="text-xs font-medium tracking-[0.15em] uppercase"
            style={{ color: borderColor }}
          >
            {tierLabel}
          </span>
        </div>

        {/* Phone and spend */}
        <div className="flex flex-wrap items-baseline gap-6 mb-8">
          {client.phone && (
            <span className="text-text-muted">{client.phone}</span>
          )}
          <span className={`text-xl font-medium ${isPremium ? 'text-gold' : 'text-text'}`}>
            {formatCurrency(client.total_spend)}
          </span>
        </div>

        {/* Dates */}
        <div className="flex gap-8 text-sm text-text-muted mb-10">
          <div>
            <span className="block text-xs uppercase tracking-wider mb-1 opacity-60">Last contact</span>
            <span>{client.lastContactLabel}</span>
          </div>
          <div>
            <span className="block text-xs uppercase tracking-wider mb-1 opacity-60">Due</span>
            <span className={isOverdue ? 'text-danger font-medium' : ''}>
              {isOverdue ? `+${client.days_overdue} days` : client.nextContactLabel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {client.phone && (
            <>
              <button
                onClick={handleCall}
                className="flex-1 py-4 bg-primary text-white text-sm font-medium tracking-[0.1em] uppercase transition-colors hover:bg-[#004D38]"
              >
                Call {client.first_name}
              </button>
              <button
                onClick={handleWhatsApp}
                className="px-6 py-4 border border-primary/20 text-primary text-sm font-medium tracking-[0.1em] uppercase transition-colors hover:bg-primary/5"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
