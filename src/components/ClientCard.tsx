import Link from 'next/link'
import { TierBadge } from './TierBadge'
import { ClientTier } from '@/lib/types'

interface ClientCardProps {
  id: string
  firstName: string
  lastName: string
  tier: ClientTier
  phone?: string | null
  email?: string | null
  totalSpend: number
  lastContactDate?: string | null
  nextRecontactDate?: string | null
  daysOverdue?: number
}

export function ClientCard({
  id,
  firstName,
  lastName,
  tier,
  phone,
  totalSpend,
  lastContactDate,
  nextRecontactDate,
  daysOverdue,
}: ClientCardProps) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const isOverdue = daysOverdue !== undefined && daysOverdue > 0

  return (
    <Link
      href={`/clients/${id}`}
      className="block card hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-serif text-lg text-ink">
            {firstName} {lastName}
          </h3>
          {phone && (
            <p className="text-sm text-ink/50 mt-0.5">{phone}</p>
          )}
        </div>
        <TierBadge tier={tier} />
      </div>

      <div className="flex items-center gap-4 text-xs text-ink/60">
        <span className="small-caps">{formatCurrency(totalSpend)}</span>

        {lastContactDate && (
          <span>
            <span className="opacity-50">Last:</span> {formatDate(lastContactDate)}
          </span>
        )}

        {nextRecontactDate && (
          <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
            <span className="opacity-50">Next:</span> {formatDate(nextRecontactDate)}
            {isOverdue && <span className="ml-1">({daysOverdue}d overdue)</span>}
          </span>
        )}
      </div>
    </Link>
  )
}
