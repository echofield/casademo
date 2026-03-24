import Link from 'next/link'
import { TierBadge } from './TierBadge'
import { SignalBadge } from './SignalBadge'
import { InterestTag } from './InterestTag'
import type { Client, ClientTier, ClientSignal, InterestItem } from '@/lib/types'

interface ClientGridCardProps {
  client: Client & {
    seller_signal?: ClientSignal | null
    interests?: InterestItem[] | null
  }
  spendLabel: string
  lastContactLabel: string
  nextRecontactLabel: string
  sellerName?: string
}

const HIGH_VALUE: ClientTier[] = ['grand_prix', 'diplomatico']

export function ClientGridCard({
  client,
  spendLabel,
  lastContactLabel,
  nextRecontactLabel,
  sellerName,
}: ClientGridCardProps) {
  const isHighValue = HIGH_VALUE.includes(client.tier)

  // Get top 3 interests for display
  const topInterests = client.interests?.slice(0, 3) || []

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group block border bg-surface p-5 transition-colors duration-200 hover:bg-bg-soft md:p-6"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-text transition-colors duration-200 group-hover:text-primary md:text-2xl">
            {client.first_name} {client.last_name}
          </h2>
          {client.phone && <p className="body-small mt-1 text-text-muted">{client.phone}</p>}
          {sellerName && (
            <p className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {sellerName}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <TierBadge tier={client.tier} />
          <SignalBadge signal={client.seller_signal ?? null} size="sm" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4" style={{ borderColor: 'rgba(28, 27, 25, 0.06)' }}>
        <div>
          <p className="label mb-1 text-text-muted">Spend</p>
          <p className={`table-value ${isHighValue ? 'text-gold' : 'text-text'}`}>{spendLabel}</p>
        </div>
        <div>
          <p className="label mb-1 text-text-muted">Last contact</p>
          <p className="body-small text-text">{lastContactLabel}</p>
        </div>
        <div>
          <p className="label mb-1 text-text-muted">Next</p>
          <p className="body-small text-text">{nextRecontactLabel}</p>
        </div>
      </div>

      {/* Interest tags */}
      {topInterests.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
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

      <p className="label text-text-muted">View profile →</p>
    </Link>
  )
}
