import { RecontactQueueRow } from './RecontactQueueRow'
import type { RecontactQueueItem } from '@/lib/types'

interface RecontactQueueSectionProps {
  title: string
  items: RecontactQueueItem[]
  urgent?: boolean
}

export function RecontactQueueSection({ title, items, urgent = false }: RecontactQueueSectionProps) {
  if (items.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className={`small-caps mb-4 ${urgent ? 'text-red-600' : 'text-ink/60'}`}>
        {title} ({items.length})
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <RecontactQueueRow key={item.id} item={item} urgent={urgent} />
        ))}
      </div>
    </section>
  )
}
