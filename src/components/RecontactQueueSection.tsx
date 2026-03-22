import { RecontactQueueRow } from './RecontactQueueRow'
import type { RecontactQueueItem } from '@/lib/types'
import { formatCurrencyEUR, formatQueueDate } from '@/lib/formatDisplay'

interface RecontactQueueSectionProps {
  title: string
  items: RecontactQueueItem[]
  urgent?: boolean
  userRole?: 'seller' | 'supervisor'
  currentUserId?: string
}

export function RecontactQueueSection({
  title,
  items,
  urgent = false,
  userRole = 'seller',
  currentUserId,
}: RecontactQueueSectionProps) {
  if (items.length === 0) return null

  return (
    <section className="mb-10">
      <h2
        className={`label mb-4 ${urgent ? 'text-danger' : 'text-text-muted'}`}
      >
        {title} <span className="text-text-muted">({items.length})</span>
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <RecontactQueueRow
            key={item.id}
            item={item}
            urgent={urgent}
            spendLabel={formatCurrencyEUR(item.total_spend)}
            lastContactLabel={formatQueueDate(item.last_contact_date)}
            nextRecontactLabel={formatQueueDate(item.next_recontact_date)}
            userRole={userRole}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </section>
  )
}
