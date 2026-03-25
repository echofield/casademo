import Link from 'next/link'
import type { ClientTier } from '@/lib/types'

// Tier colors matching the design
const TIER_COLORS: Record<ClientTier, string> = {
  rainbow: '#6B7280',      // gray
  optimisto: '#6B7280',    // gray
  kaizen: '#6B7280',       // gray
  idealiste: '#A38767',    // gold/tan
  diplomatico: '#A38767',  // gold/tan
  grand_prix: '#A38767',   // gold/tan
}

const TIER_LABELS: Record<ClientTier, string> = {
  rainbow: 'RAINBOW',
  optimisto: 'OPTIMISTO',
  kaizen: 'KAIZEN',
  idealiste: 'IDEALISTE',
  diplomatico: 'DIPLOMATICO',
  grand_prix: 'GRAND PRIX',
}

const HIGH_VALUE: ClientTier[] = ['grand_prix', 'diplomatico', 'idealiste']

interface ClientGridCardProps {
  client: {
    id: string
    first_name: string
    last_name: string
    phone: string | null
    tier: ClientTier
    total_spend: number
  }
  spendLabel: string
  lastContactLabel: string
  nextRecontactLabel: string
  sellerName?: string | null
}

export function ClientGridCard({
  client,
  spendLabel,
  lastContactLabel,
  nextRecontactLabel,
  sellerName,
}: ClientGridCardProps) {
  const isHighValue = HIGH_VALUE.includes(client.tier)
  const tierColor = TIER_COLORS[client.tier]

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group block bg-white border p-6 transition-all duration-200 hover:shadow-sm active:scale-[0.98]"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      {/* Header: Name + Tier */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-serif text-2xl text-text leading-tight">
          {client.first_name} {client.last_name}
        </h2>
        <span
          className="text-xs tracking-wider font-medium shrink-0 mt-1"
          style={{ color: tierColor }}
        >
          {TIER_LABELS[client.tier]}
        </span>
      </div>

      {/* Phone + Seller */}
      <div className="mb-6">
        {client.phone && (
          <p className="text-sm text-text-muted">
            {client.phone}
          </p>
        )}
        {sellerName && (
          <p className="text-[11px] tracking-wide text-text-muted/70 mt-1">
            {sellerName}
          </p>
        )}
        {!client.phone && !sellerName && <div />}
      </div>

      {/* Stats row */}
      <div className="flex gap-8 mb-6">
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Spend</p>
          <p
            className="font-serif text-lg"
            style={{ color: isHighValue ? '#A38767' : '#1C1B19' }}
          >
            {spendLabel}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Last contact</p>
          <p className="text-sm text-text">{lastContactLabel}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Next</p>
          <p className="text-sm text-text">{nextRecontactLabel}</p>
        </div>
      </div>

      {/* View profile link */}
      <p className="text-xs tracking-wider text-text-muted uppercase group-hover:text-primary transition-colors">
        View profile →
      </p>
    </Link>
  )
}
