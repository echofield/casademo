import Link from 'next/link'
import type { ClientTier } from '@/lib/types'

interface Props {
  seller: {
    id: string
    name: string
    clientCount: number
    remainingCount: number
    contactsWeek: number
    overdueCount: number
    totalSpend: number
    aJourPct: number
    tiers: Record<ClientTier, number>
  }
  tierOrder: ClientTier[]
}

export function SellerCard({ seller, tierOrder }: Props) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' €'
  }

  const hasOverdue = seller.overdueCount > 0
  const statusColor = hasOverdue ? '#C34747' : '#2F6B4F'

  return (
    <div
      className="bg-white border p-6"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      {/* Header: Name + Status */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <h2 className="font-serif text-2xl text-text leading-tight">
          {seller.name}
        </h2>
        <span
          className="text-xs tracking-wider font-medium shrink-0 mt-1"
          style={{ color: statusColor }}
        >
          {hasOverdue ? `${seller.overdueCount} OVERDUE` : 'UP TO DATE'}
        </span>
      </div>

      {/* Client count */}
      <p className="text-sm text-text-muted mb-6">
        {seller.remainingCount} left this cycle · {seller.clientCount} in portfolio
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-6 mb-6 sm:grid-cols-4">
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Revenue</p>
          <p
            className="font-serif text-lg"
            style={{ color: seller.totalSpend >= 10000 ? '#A38767' : '#1C1B19' }}
          >
            {formatCurrency(seller.totalSpend)}
          </p>
        </div>
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Remaining</p>
          <p className="font-serif text-lg text-text">{seller.remainingCount}</p>
        </div>
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Contacts</p>
          <Link href={`/team/${seller.id}#contacts-week`} className="text-sm text-text hover:text-primary transition-colors">
            {seller.contactsWeek} this week
          </Link>
        </div>
        <div>
          <p className="text-[11px] tracking-wider text-text-muted uppercase mb-1">Up to date</p>
          <p className="text-sm text-text">{seller.aJourPct}%</p>
        </div>
      </div>

      {/* View clients link */}
      <Link
        href={`/team/${seller.id}`}
        className="text-xs tracking-wider text-text-muted uppercase hover:text-primary transition-colors"
      >
        View clients →
      </Link>
    </div>
  )
}
