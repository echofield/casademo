import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell, RecontactQueueSection, TierBadge, TodayMeetings, SellerImpactWidget } from '@/components'
import { RecontactQueueItem, ClientTier, TIER_ORDER } from '@/lib/types'
import { Users, Phone, TrendingUp } from 'lucide-react'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const isSeller = user.effectiveRole === 'seller'
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Build all queries - will run in parallel
  // Use select('*') for view - it already returns optimized columns
  const queueQuery = supabase
    .from('recontact_queue')
    .select('*')
    .order('days_overdue', { ascending: false })
    .limit(50) // Home preview - not full queue

  // Apply seller filter if needed
  const filteredQueueQuery = isSeller ? queueQuery.eq('seller_id', user.id) : queueQuery

  // Seller stats queries (only run if seller)
  const sellerStatsPromises = isSeller ? [
    supabase
      .from('clients')
      .select('id, total_spend, tier')
      .eq('seller_id', user.id),
    supabase
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .gte('contact_date', weekAgo.toISOString()),
  ] : []

  // Run all queries in parallel
  const [queueResult, ...sellerResults] = await Promise.all([
    filteredQueueQuery,
    ...sellerStatsPromises,
  ])

  const items = (queueResult.data || []) as RecontactQueueItem[]

  const overdue = items.filter((i) => (i.days_overdue ?? 0) > 0)
  const dueToday = items.filter((i) => (i.days_overdue ?? 0) === 0)
  const upcoming = items.filter((i) => (i.days_overdue ?? 0) < 0)

  const urgentTotal = overdue.length + dueToday.length

  // Process seller stats if available
  let sellerStats = null
  let recentContacts: Array<{
    id: string
    contact_date: string
    channel: string
    client: { id: string; first_name: string; last_name: string } | { id: string; first_name: string; last_name: string }[] | null
  }> = []
  if (isSeller && sellerResults.length === 2) {
    const clientsResult = sellerResults[0] as { data: { id: string; total_spend: number; tier: string }[] | null }
    const contactsResult = sellerResults[1] as { count: number | null }
    const myClients = clientsResult.data || []
    const contactsThisWeek = contactsResult.count || 0

    // Calculate tier breakdown
    const tierCounts: Record<ClientTier, number> = {
      rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0
    }
    let totalSpend = 0
    myClients.forEach((c) => {
      if (c.tier) tierCounts[c.tier as ClientTier]++
      totalSpend += c.total_spend || 0
    })

    sellerStats = {
      totalClients: myClients.length,
      remainingCount: items.length,
      totalSpend,
      contactsThisWeek,
      tierCounts,
    }
  }

  if (isSeller) {
    const { data } = await supabase
      .from('contacts')
      .select('id, contact_date, channel, client:clients(id, first_name, last_name)')
      .eq('seller_id', user.id)
      .order('contact_date', { ascending: false })
      .limit(5)
    recentContacts = (data || []) as any
  }

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-4xl animate-fade-in">
        <header className="mb-10">
          <p className="label mb-3 text-text-muted">Overview</p>
          <h1 className="heading-1 text-text">Good day{user.profile.full_name ? `, ${user.profile.full_name.split(' ')[0]}` : ''}</h1>
          <p className="body mt-2 max-w-xl text-text-muted">
            Here&apos;s how your portfolio looks today — and the fastest place to act.
          </p>
        </header>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryStat label={isSeller ? 'Remaining' : 'Total due'} value={items.length} href="/queue" />
          <SummaryStat label="Overdue" value={overdue.length} tone={overdue.length > 0 ? 'danger' : 'default'} href="/queue?status=overdue" />
          <SummaryStat label="Due today" value={dueToday.length} tone={dueToday.length > 0 ? 'gold' : 'default'} href="/queue?status=today" />
          <SummaryStat label="Upcoming" value={upcoming.length} href="/queue?status=upcoming" />
        </div>

        {/* Seller Portfolio Stats */}
        {isSeller && sellerStats && (
          <div className="mb-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Portfolio Overview */}
            <div
              className="border bg-surface p-5"
              style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="label text-text-muted">MY PORTFOLIO</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-text-muted mb-1">Clients</p>
                  <p className="font-serif text-2xl text-text">{sellerStats.totalClients}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Remaining</p>
                  <p className="font-serif text-2xl text-primary">{sellerStats.remainingCount}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Contacts (7d)</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                    <p className="font-serif text-2xl text-text">{sellerStats.contactsThisWeek}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(28, 27, 25, 0.06)' }}>
                <p className="text-xs text-text-muted mb-1">Total CA</p>
                <p className="font-serif text-2xl text-primary">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(sellerStats.totalSpend)}
                </p>
              </div>
            </div>

            {/* Tier Breakdown */}
            <div
              className="border bg-surface p-5"
              style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
                <span className="label text-text-muted">MY TIERS</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TIER_ORDER.filter(t => sellerStats.tierCounts[t] > 0).map((tier) => (
                  <div key={tier} className="flex items-center gap-2 pr-3">
                    <TierBadge tier={tier} />
                    <span className="font-serif text-lg text-text">{sellerStats.tierCounts[tier]}</span>
                  </div>
                ))}
                {Object.values(sellerStats.tierCounts).every(c => c === 0) && (
                  <p className="text-sm text-text-muted">No clients yet</p>
                )}
              </div>
            </div>

            {/* CRM Impact Widget */}
            <SellerImpactWidget sellerId={user.id} />
          </div>
        )}

        {/* Today's Meetings */}
        <TodayMeetings />

        {isSeller && (
          <div
            className="mb-10 border bg-surface p-6 md:p-8"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <p className="label mb-4 text-text-muted">Recent activity</p>
            {recentContacts.length === 0 ? (
              <p className="text-sm text-text-muted">No recent contacts logged.</p>
            ) : (
              <div className="space-y-2">
                {recentContacts.map((contact) => {
                  const client = Array.isArray(contact.client) ? contact.client[0] : contact.client
                  const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ')
                  const contactDate = new Date(contact.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const channel = contact.channel.replace('_', ' ')
                  return (
                    <Link key={contact.id} href={client?.id ? `/clients/${client.id}` : '/clients'} className="block text-sm text-text-muted hover:text-text transition-colors">
                      {clientName || 'Client'} · {contactDate} · {channel}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div
          className="mb-12 border bg-surface p-6 md:p-8"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <p className="label mb-2 text-text-muted">Next step</p>
          {items.length === 0 ? (
            <p className="font-serif text-2xl text-text">You&apos;re fully caught up.</p>
          ) : (
            <>
              <p className="mb-6 font-serif text-2xl leading-snug text-text md:text-3xl">
                {urgentTotal > 0 ? (
                  <>
                    <span className={overdue.length > 0 ? 'text-danger' : 'text-gold'}>{urgentTotal}</span>{' '}
                    {urgentTotal === 1 ? 'client needs' : 'clients need'} your attention
                    {overdue.length > 0 && dueToday.length > 0 ? ' today or earlier' : overdue.length > 0 ? ' now' : ' today'}
                    .
                  </>
                ) : (
                  <>No urgent items — {upcoming.length} upcoming recontact{upcoming.length !== 1 ? 's' : ''} in the queue.</>
                )}
              </p>
              <Link
                href="/queue"
                className="inline-flex items-center justify-center bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-primary-soft"
              >
                Work the queue
              </Link>
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div
            className="border bg-surface py-14 text-center"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <p className="text-text-muted">No contacts due in the queue.</p>
            <p className="narrator mt-2">Enjoy the calm.</p>
          </div>
        ) : (
          <>
            <p className="label mb-6 text-text-muted">By priority</p>
            <RecontactQueueSection title="Overdue" items={overdue} urgent userRole={user.effectiveRole} currentUserId={user.id} />
            <RecontactQueueSection title="Due today" items={dueToday} userRole={user.effectiveRole} currentUserId={user.id} />
            <RecontactQueueSection title="Upcoming" items={upcoming} userRole={user.effectiveRole} currentUserId={user.id} />
          </>
        )}
      </div>
    </AppShell>
  )
}

function SummaryStat({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: string
  value: number
  tone?: 'default' | 'danger' | 'gold'
  href?: string
}) {
  const valueClass =
    tone === 'danger' ? 'text-danger' : tone === 'gold' ? 'text-gold' : 'text-text'
  const content = (
    <div
      className={`border bg-surface px-4 py-4 transition-colors ${href ? 'hover:border-primary/30 cursor-pointer' : ''}`}
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      <p className="label mb-2 text-text-muted">{label}</p>
      <p className={`metric-small ${valueClass}`}>{value}</p>
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : content
}
