import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, QueueStack } from '@/components'
import { RecontactQueueItem, InterestItem, ClientSignal } from '@/lib/types'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoClients, getDemoQueue } from '@/lib/demo/presentation-data'

export default async function QueuePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isSeller = user.effectiveRole === 'seller'

  let items: (RecontactQueueItem & {
    seller_signal?: ClientSignal | null
    signal_note?: string | null
  })[] = []
  let exactRemainingCount: number | null = null
  const clientInterestsMap = new Map<string, InterestItem[]>()

  if (isDemoMode) {
    items = getDemoQueue(user.effectiveRole, user.id) as typeof items
    exactRemainingCount = items.length
    getDemoClients().forEach((client) => {
      clientInterestsMap.set(client.id, client.interests || [])
    })
  } else {
    const supabase = await createClient()

    let query = supabase.from('recontact_queue').select('*').limit(50)
    let countQuery = supabase.from('recontact_queue').select('id', { count: 'exact', head: true })

    if (isSeller) {
      query = query.eq('seller_id', user.id)
      countQuery = countQuery.eq('seller_id', user.id)
    }

    const [{ data: queue }, { count }] = await Promise.all([query, countQuery])
    items = (queue || []) as typeof items
    exactRemainingCount = count

    const clientIds = items.map((item) => item.id)
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
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  }

  const clientsWithLabels = items.map((item) => ({
    id: item.id,
    first_name: item.first_name,
    last_name: item.last_name,
    tier: item.tier,
    phone: item.phone,
    total_spend: item.total_spend,
    days_overdue: item.days_overdue,
    last_contact_date: item.last_contact_date,
    seller_id: item.seller_id,
    seller_name: item.seller_name,
    lastContactLabel: formatDate(item.last_contact_date),
    nextContactLabel: formatDate(item.next_recontact_date),
    seller_signal: item.seller_signal ?? null,
    signal_note: item.signal_note ?? null,
    interests: clientInterestsMap.get(item.id) || null,
    locale: (item as any).locale || 'local',
  }))

  const overdueCount = items.filter((item) => (item.days_overdue ?? 0) > 0).length

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <QueueStack
          clients={clientsWithLabels}
          overdueCount={overdueCount}
          totalCount={items.length}
          userRole={user.profile.role}
          currentUserId={user.id}
          remainingWorkloadCount={isSeller ? (exactRemainingCount ?? items.length) : undefined}
        />
      </div>
    </AppShell>
  )
}

