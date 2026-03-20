import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, QueueStack } from '@/components'
import { RecontactQueueItem } from '@/lib/types'

export default async function QueuePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: queue } = await supabase
    .from('recontact_queue')
    .select('*')
    .order('days_overdue', { ascending: false })

  const items = (queue || []) as RecontactQueueItem[]

  // Pre-format dates server-side
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const clientsWithLabels = items.map(item => ({
    id: item.id,
    first_name: item.first_name,
    last_name: item.last_name,
    tier: item.tier,
    phone: item.phone,
    total_spend: item.total_spend,
    days_overdue: item.days_overdue,
    lastContactLabel: formatDate(item.last_contact_date),
    nextContactLabel: formatDate(item.next_recontact_date),
  }))

  const overdueCount = items.filter(i => (i.days_overdue ?? 0) > 0).length

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <QueueStack
          clients={clientsWithLabels}
          overdueCount={overdueCount}
          totalCount={items.length}
        />
      </div>
    </AppShell>
  )
}
