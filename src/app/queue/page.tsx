import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, PageHeader, ClientRow } from '@/components'
import { RecontactQueueItem } from '@/lib/types'
import { QueueFilters } from './QueueFilters'

export default async function QueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const filter = params.filter || 'all'

  const supabase = await createClient()
  const { data: queue } = await supabase
    .from('recontact_queue')
    .select('*')
    .order('days_overdue', { ascending: false })

  const items = (queue || []) as RecontactQueueItem[]

  // Filter items based on selection
  const overdue = items.filter(i => (i.days_overdue ?? 0) > 0)
  const dueToday = items.filter(i => (i.days_overdue ?? 0) === 0)
  const upcoming = items.filter(i => (i.days_overdue ?? 0) < 0)
  const highValue = items.filter(i => ['grand_prix', 'diplomatico'].includes(i.tier))

  let displayItems: RecontactQueueItem[]
  switch (filter) {
    case 'overdue':
      displayItems = overdue
      break
    case 'today':
      displayItems = dueToday
      break
    case 'upcoming':
      displayItems = upcoming
      break
    case 'high-value':
      displayItems = highValue
      break
    default:
      displayItems = items
  }

  // Pre-format dates server-side to avoid hydration issues
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const clientsWithLabels = displayItems.map(item => ({
    ...item,
    lastContactLabel: formatDate(item.last_contact_date),
    nextContactLabel: formatDate(item.next_recontact_date),
  }))

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <PageHeader
          title="Recontact Queue"
          subtitle={`${overdue.length} overdue · ${items.length} total`}
          actions={
            <QueueFilters
              current={filter}
              counts={{
                all: items.length,
                overdue: overdue.length,
                today: dueToday.length,
                upcoming: upcoming.length,
                highValue: highValue.length,
              }}
            />
          }
        />

        {displayItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-text-muted mb-2">No clients in this view</p>
            <p className="text-sm text-text-muted">
              {filter === 'all' ? 'All caught up for now' : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div className="bg-surface" style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}>
            {clientsWithLabels.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                showOverdue
                lastContactLabel={client.lastContactLabel}
                nextContactLabel={client.nextContactLabel}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
