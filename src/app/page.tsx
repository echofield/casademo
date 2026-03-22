import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell, RecontactQueueSection, TierBadge } from '@/components'
import { RecontactQueueItem, ClientTier, TIER_ORDER } from '@/lib/types'
import { Users, Phone, TrendingUp } from 'lucide-react'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Demo mode filter
  const DEMO_MODE = true
  const isSeller = user.profile.role === 'seller'

  // Sellers only see their own clients, supervisors see all
  let query = supabase
    .from('recontact_queue')
    .select('*')
    .eq('is_demo', DEMO_MODE)

  if (isSeller) {
    query = query.eq('seller_id', user.id)
  }

  const { data: queue } = await query.order('days_overdue', { ascending: false })

  const items = (queue || []) as RecontactQueueItem[]

  const overdue = items.filter((i) => (i.days_overdue ?? 0) > 0)
  const dueToday = items.filter((i) => (i.days_overdue ?? 0) === 0)
  const upcoming = items.filter((i) => (i.days_overdue ?? 0) < 0)

  const urgentTotal = overdue.length + dueToday.length

  // Seller-specific stats
  let sellerStats = null
  if (isSeller) {
    // Get seller's clients with spend and tier
    const { data: myClients } = await supabase
      .from('clients')
      .select('id, total_spend, tier')
      .eq('is_demo', DEMO_MODE)
      .eq('seller_id', user.id)

    // Get seller's contacts this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: contactsThisWeek } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .gte('contact_date', weekAgo.toISOString())

    // Calculate tier breakdown
    const tierCounts: Record<ClientTier, number> = {
      rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0
    }
    let totalSpend = 0
    ;(myClients || []).forEach(c => {
      if (c.tier) tierCounts[c.tier as ClientTier]++
      totalSpend += c.total_spend || 0
    })

    sellerStats = {
      totalClients: myClients?.length || 0,
      totalSpend,
      contactsThisWeek: contactsThisWeek || 0,
      tierCounts,
    }
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-4xl animate-fade-in">
        <header className="mb-10">
          <p className="label mb-3 text-text-muted">Overview</p>
          <h1 className="heading-1 text-text">Good day{user.profile.full_name ? `, ${user.profile.full_name.split(' ')[0]}` : ''}</h1>
          <p className="body mt-2 max-w-xl text-text-muted">
            Here&apos;s how your portfolio looks today — and the fastest place to act.
          </p>
        </header>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryStat label="Total due" value={items.length} />
          <SummaryStat label="Overdue" value={overdue.length} tone={overdue.length > 0 ? 'danger' : 'default'} />
          <SummaryStat label="Due today" value={dueToday.length} tone={dueToday.length > 0 ? 'gold' : 'default'} />
          <SummaryStat label="Upcoming" value={upcoming.length} />
        </div>

        {/* Seller Portfolio Stats */}
        {isSeller && sellerStats && (
          <div className="mb-10 grid gap-4 md:grid-cols-2">
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
                  <p className="text-xs text-text-muted mb-1">Total CA</p>
                  <p className="font-serif text-2xl text-primary">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(sellerStats.totalSpend)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-1">Contacts (7d)</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-muted" strokeWidth={1.5} />
                    <p className="font-serif text-2xl text-text">{sellerStats.contactsThisWeek}</p>
                  </div>
                </div>
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
            <RecontactQueueSection title="Overdue" items={overdue} urgent userRole={user.profile.role} currentUserId={user.id} />
            <RecontactQueueSection title="Due today" items={dueToday} userRole={user.profile.role} currentUserId={user.id} />
            <RecontactQueueSection title="Upcoming" items={upcoming} userRole={user.profile.role} currentUserId={user.id} />
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
}: {
  label: string
  value: number
  tone?: 'default' | 'danger' | 'gold'
}) {
  const valueClass =
    tone === 'danger' ? 'text-danger' : tone === 'gold' ? 'text-gold' : 'text-text'
  return (
    <div
      className="border bg-surface px-4 py-4"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      <p className="label mb-2 text-text-muted">{label}</p>
      <p className={`metric-small ${valueClass}`}>{value}</p>
    </div>
  )
}
