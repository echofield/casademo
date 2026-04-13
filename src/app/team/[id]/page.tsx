import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell, BackNavButton, QueueStack } from '@/components'
import type { InterestItem } from '@/lib/types'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoClients, getDemoQueue, getDemoRecentContacts, getDemoSellerRoster } from '@/lib/demo/presentation-data'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SellerDetailPage({ params }: PageProps) {
  const { id: sellerId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.effectiveRole !== 'supervisor') {
    redirect('/queue')
  }

  let seller: { id: string; full_name: string; role?: string } | null = null
  let items: Array<any> = []
  let exactRemainingCount = 0
  let weekContacts: Array<any> = []
  let portfolioCount = 0
  const clientInterestsMap = new Map<string, InterestItem[]>()
  let totalSpend = 0

  if (isDemoMode) {
    seller = getDemoSellerRoster().find((entry) => entry.id === sellerId) || null
    if (!seller) redirect('/team')

    const clients = getDemoClients().filter((client) => client.seller_id === sellerId)
    clients.forEach((client) => {
      clientInterestsMap.set(client.id, client.interests || [])
    })

    items = getDemoQueue('supervisor').filter((item) => item.seller_id === sellerId)
    exactRemainingCount = items.length
    weekContacts = getDemoRecentContacts(sellerId, 50).map((contact) => ({
      id: contact.id,
      contact_date: contact.date,
      channel: contact.channel,
      client: contact.client,
    }))
    portfolioCount = clients.length
    totalSpend = clients.reduce((sum, client) => sum + client.total_spend, 0)
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: sellerRow } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', sellerId)
      .single()

    if (!sellerRow) {
      redirect('/team')
    }

    seller = sellerRow

    const [{ data: queue }, { count }, { data: contactRows }, { count: portfolio }] = await Promise.all([
      supabase.from('recontact_queue').select('*').eq('seller_id', sellerId).limit(100),
      supabase.from('recontact_queue').select('id', { count: 'exact', head: true }).eq('seller_id', sellerId),
      supabase
        .from('contacts')
        .select('id, contact_date, channel, client:clients(first_name, last_name)')
        .eq('seller_id', sellerId)
        .gte('contact_date', weekAgo.toISOString())
        .order('contact_date', { ascending: false })
        .limit(50),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('seller_id', sellerId),
    ])

    items = queue || []
    exactRemainingCount = count || items.length
    weekContacts = contactRows || []
    portfolioCount = portfolio || 0

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

    totalSpend = items.reduce((sum, client) => sum + (client.total_spend || 0), 0)
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
    seller_id: item.seller_id,
    seller_name: item.seller_name,
    lastContactLabel: formatDate(item.last_contact_date),
    nextContactLabel: formatDate(item.next_recontact_date),
    seller_signal: (item as any).seller_signal ?? null,
    signal_note: (item as any).signal_note ?? null,
    interests: clientInterestsMap.get(item.id) || null,
    locale: (item as any).locale || 'local',
  }))

  const overdueCount = items.filter((item) => (item.days_overdue ?? 0) > 0).length

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)

  const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' }
  const channelLabel = (value: string) => value.replace('_', ' ')

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <BackNavButton fallbackHref="/team" label="Back to team" className="mb-6" />

        <div className="mb-8 border bg-surface p-6" style={cardBorder}>
          <h1 className="mb-2 font-serif text-3xl text-text">{seller?.full_name}</h1>
          <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-text-muted">Remaining</span><span className="ml-2 font-medium text-text">{exactRemainingCount}</span></div>
            <div><span className="text-text-muted">Portfolio</span><span className="ml-2 font-medium text-text">{portfolioCount}</span></div>
            <div><span className="text-text-muted">Value</span><span className="ml-2 font-medium text-text">{formatCurrency(totalSpend)}</span></div>
            {overdueCount > 0 && <div><span className="font-medium text-danger">{overdueCount} overdue</span></div>}
          </div>
        </div>

        {clientsWithLabels.length === 0 ? (
          <div className="border bg-surface py-16 text-center" style={cardBorder}>
            <p className="mb-2 font-serif text-xl text-text">No clients</p>
            <p className="text-sm text-text-muted">This seller has no assigned clients.</p>
          </div>
        ) : (
          <QueueStack
            clients={clientsWithLabels}
            overdueCount={overdueCount}
            totalCount={items.length}
            userRole={user.profile.role}
            currentUserId={user.id}
            remainingWorkloadCount={exactRemainingCount}
          />
        )}

        <div id="contacts-week" className="mt-8 border bg-surface p-6" style={cardBorder}>
          <h2 className="mb-2 font-serif text-xl text-text">Contacts this week</h2>
          {!(weekContacts && weekContacts.length > 0) ? (
            <p className="text-sm text-text-muted">No contacts logged in the last 7 days.</p>
          ) : (
            <div className="space-y-2">
              {weekContacts.map((contact) => {
                const client = (Array.isArray(contact.client) ? contact.client[0] : contact.client) as { id?: string; first_name?: string; last_name?: string } | null
                const fullName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Client'
                return (
                  <div key={contact.id} className="text-sm text-text-muted">
                    <Link href={client?.id ? `/clients/${client.id}` : '/clients'} className="transition-colors hover:text-text">{fullName}</Link>
                    {' · '}
                    {new Date(contact.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {channelLabel(contact.channel)}
                    {' · '}
                    {seller?.full_name}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

