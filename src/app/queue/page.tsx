import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, QueueStack } from '@/components'
import { RecontactQueueItem, InterestItem, ClientSignal } from '@/lib/types'

export default async function QueuePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const isSeller = user.effectiveRole === 'seller'

  // Sellers only see their own clients, supervisors see all
  // Limit to 50 items max - a seller can't act on hundreds at once
  // Use select('*') for view - it already returns optimized columns
  let query = supabase
    .from('recontact_queue')
    .select('*')
    .limit(50)

  if (isSeller) {
    query = query.eq('seller_id', user.id)
  }

  // The view now orders by signal priority, then days_overdue, then tier
  const { data: queue } = await query

  const items = (queue || []) as (RecontactQueueItem & {
    seller_signal?: ClientSignal | null
    signal_note?: string | null
  })[]

  // Fetch interests for queue clients
  const clientIds = items.map(i => i.id)
  let clientInterestsMap = new Map<string, InterestItem[]>()

  if (clientIds.length > 0) {
    const { data: allInterests } = await supabase
      .from('client_interests')
      .select('id, client_id, category, value, detail, domain')
      .in('client_id', clientIds)
      .eq('is_deleted', false)

    ;(allInterests || []).forEach((interest) => {
      const existing = clientInterestsMap.get(interest.client_id) || []
      existing.push({
        id: interest.id,
        category: interest.category,
        value: interest.value,
        detail: interest.detail,
        domain: (interest.domain || 'product') as 'product' | 'life',
      })
      clientInterestsMap.set(interest.client_id, existing)
    })
  }

  // Pre-format dates server-side
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
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
    seller_id: item.seller_id,
    seller_name: item.seller_name,
    lastContactLabel: formatDate(item.last_contact_date),
    nextContactLabel: formatDate(item.next_recontact_date),
    seller_signal: item.seller_signal ?? null,
    signal_note: item.signal_note ?? null,
    interests: clientInterestsMap.get(item.id) || null,
    locale: (item as any).locale || 'local',
  }))

  const overdueCount = items.filter(i => (i.days_overdue ?? 0) > 0).length

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <QueueStack
          clients={clientsWithLabels}
          overdueCount={overdueCount}
          totalCount={items.length}
          userRole={user.profile.role}
          currentUserId={user.id}
          remainingWorkloadCount={isSeller ? items.length : undefined}
        />
      </div>
    </AppShell>
  )
}
