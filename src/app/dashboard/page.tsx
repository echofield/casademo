import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge, PageHeader } from '@/components'
import { ClientTier, TIER_ORDER } from '@/lib/types'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.profile.role !== 'supervisor') {
    redirect('/queue')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  const { data: tierCounts } = await supabase.from('clients').select('tier')

  const clientsByTier: Record<ClientTier, number> = {
    rainbow: 0,
    optimisto: 0,
    kaizen: 0,
    idealiste: 0,
    diplomatico: 0,
    grand_prix: 0,
  }

  tierCounts?.forEach((c) => {
    if (c.tier) clientsByTier[c.tier as ClientTier]++
  })

  const totalClients = tierCounts?.length || 0

  const { data: overdueData, count: totalOverdue } = await supabase
    .from('recontact_queue')
    .select('*', { count: 'exact' })
    .gt('days_overdue', 0)

  const sellerOverdue: Record<string, { name: string; count: number }> = {}
  overdueData?.forEach((item) => {
    const sellerId = item.seller_id
    const sellerName = item.seller_name || 'Unknown'
    if (!sellerOverdue[sellerId]) {
      sellerOverdue[sellerId] = { name: sellerName, count: 0 }
    }
    sellerOverdue[sellerId].count++
  })

  const overdueBySellerArr = Object.entries(sellerOverdue)
    .map(([id, data]) => ({
      seller_id: id,
      seller_name: data.name,
      overdue_count: data.count,
    }))
    .sort((a, b) => b.overdue_count - a.overdue_count)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: contactsThisWeek } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .gte('contact_date', weekAgo.toISOString())

  const { data: sellerActivity } = await supabase
    .from('contacts')
    .select('seller_id')
    .gte('contact_date', weekAgo.toISOString())

  const activityMap: Record<string, number> = {}
  sellerActivity?.forEach((item) => {
    activityMap[item.seller_id] = (activityMap[item.seller_id] || 0) + 1
  })

  const { data: allSellers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'seller')
    .eq('active', true)

  const sellerActivityArr = (allSellers || [])
    .map((seller) => {
      const overdue = sellerOverdue[seller.id]
      return {
        seller_id: seller.id,
        seller_name: seller.full_name,
        contacts_this_week: activityMap[seller.id] || 0,
        overdue_count: overdue?.count || 0,
      }
    })
    .sort((a, b) => b.contacts_this_week - a.contacts_this_week)

  const maxTierCount = Math.max(...Object.values(clientsByTier), 1)
  const contactsWeek = contactsThisWeek || 0
  const overdueTotal = totalOverdue || 0

  let headline = ''
  let subline = ''
  if (overdueTotal > 0) {
    headline = `${overdueTotal} client${overdueTotal !== 1 ? 's are' : ' is'} overdue company-wide.`
    subline = 'Prioritize recontacts this week — rhythm matters more than volume.'
  } else if (contactsWeek === 0) {
    headline = 'No contacts logged in the last seven days.'
    subline = 'Check in with sellers before the queue goes quiet.'
  } else {
    headline = `Team logged ${contactsWeek} contact${contactsWeek !== 1 ? 's' : ''} this week.`
    subline = overdueBySellerArr.length
      ? 'Some sellers still carry overdue accounts — see breakdown below.'
      : 'No overdue clients in the queue right now.'
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl animate-fade-in">
        <PageHeader title="Dashboard" subtitle="Team pressure and rhythm" />

        <section
          className="mb-10 border bg-surface p-6 md:p-8"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <p className="label mb-4 text-text-muted">This week</p>
          <h2 className="heading-2 mb-3 max-w-3xl text-text">{headline}</h2>
          <p className="body max-w-2xl text-text-muted">{subline}</p>
        </section>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat label="Total clients" value={totalClients} />
          <MiniStat label="Contacts (7d)" value={contactsWeek} />
          <MiniStat label="Overdue" value={overdueTotal} tone={overdueTotal > 0 ? 'danger' : 'default'} />
          <MiniStat label="Avg / day" value={(contactsWeek / 7).toFixed(1)} />
        </div>

        <section
          className="mb-10 border bg-surface p-6"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <h2 className="label mb-6 text-text-muted">Seller rhythm</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}>
                  <th className="label py-3 pr-4 text-left font-semibold text-text-muted">Seller</th>
                  <th className="label py-3 px-3 text-center font-semibold text-text-muted">Contacts</th>
                  <th className="label py-3 px-3 text-center font-semibold text-text-muted">Overdue</th>
                  <th className="label py-3 pl-3 text-center font-semibold text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {sellerActivityArr.map((seller) => {
                  const isInactive = seller.contacts_this_week === 0
                  const hasOverdue = seller.overdue_count > 5
                  const status = isInactive ? 'inactive' : hasOverdue ? 'warning' : 'ok'

                  return (
                    <tr key={seller.seller_id} style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}>
                      <td className="py-4 pr-4">
                        <span className="table-value text-text">{seller.seller_name}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`metric-small ${seller.contacts_this_week === 0 ? 'text-danger' : 'text-primary'}`}
                        >
                          {seller.contacts_this_week}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`metric-small ${seller.overdue_count > 0 ? 'text-gold' : 'text-text-muted'}`}
                        >
                          {seller.overdue_count}
                        </span>
                      </td>
                      <td className="py-4 pl-3 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="border bg-surface p-6" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
            <h2 className="label mb-6 text-text-muted">Clients by tier</h2>
            <div className="space-y-4">
              {TIER_ORDER.map((tier) => {
                const count = clientsByTier[tier]
                const percentage = (count / maxTierCount) * 100

                return (
                  <div key={tier} className="flex items-center gap-4">
                    <div className="w-28 shrink-0">
                      <TierBadge tier={tier} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="h-1.5 overflow-hidden bg-bg-soft" style={{ borderRadius: 1 }}>
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-medium text-text">{count}</span>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="border bg-surface p-6" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
            <h2 className="label mb-6 text-text-muted">Overdue by seller</h2>
            {overdueBySellerArr.length === 0 ? (
              <p className="body-small text-text-muted">No overdue clients.</p>
            ) : (
              <ul className="space-y-0">
                {overdueBySellerArr.map((seller) => (
                  <li
                    key={seller.seller_id}
                    className="flex items-center justify-between border-b py-4 last:border-0"
                    style={{ borderColor: 'rgba(28, 27, 25, 0.06)' }}
                  >
                    <span className="body-small text-text">{seller.seller_name}</span>
                    <span className="metric-small text-danger">{seller.overdue_count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function MiniStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string | number
  tone?: 'default' | 'danger'
}) {
  const cls = tone === 'danger' ? 'text-danger' : 'text-text'
  return (
    <div className="border bg-surface px-4 py-4" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      <p className="label mb-2 text-text-muted">{label}</p>
      <p className={`metric-small ${cls}`}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: 'inactive' | 'warning' | 'ok' }) {
  const styles = {
    inactive: 'bg-overdue-soft text-danger',
    warning: 'bg-gold-soft text-gold',
    ok: 'bg-primary-soft text-primary',
  }

  const labels = {
    inactive: 'No activity',
    warning: 'Falling behind',
    ok: 'On track',
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>
  )
}
