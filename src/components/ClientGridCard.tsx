import Link from 'next/link'
import { TierBadge } from './TierBadge'
import type { Client, ClientTier } from '@/lib/types'

interface ClientGridCardProps {
  client: Client
  spendLabel: string
  lastContactLabel: string
  nextRecontactLabel: string
}

const HIGH_VALUE: ClientTier[] = ['grand_prix', 'diplomatico']

export function ClientGridCard({
  client,
  spendLabel,
  lastContactLabel,
  nextRecontactLabel,
}: ClientGridCardProps) {
  const isHighValue = HIGH_VALUE.includes(client.tier)

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
        </div>
        <TierBadge tier={client.tier} />
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

      <p className="label text-text-muted">View profile →</p>
    </Link>
  )
}
