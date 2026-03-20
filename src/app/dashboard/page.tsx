import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge, PageHeader, StatCard } from '@/components'
import { DashboardMetrics, TIER_ORDER, ClientTier } from '@/lib/types'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.profile.role !== 'supervisor') {
    redirect('/queue')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()

  // Get clients by tier
  const { data: tierCounts } = await supabase
    .from('clients')
    .select('tier')

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

  // Get overdue count
  const { data: overdueData, count: totalOverdue } = await supabase
    .from('recontact_queue')
    .select('*', { count: 'exact' })
    .gt('days_overdue', 0)

  // Get overdue by seller
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

  // Get contacts this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { count: contactsThisWeek } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .gte('contact_date', weekAgo.toISOString())

  // Get seller activity
  const { data: sellerActivity } = await supabase
    .from('contacts')
    .select('seller_id')
    .gte('contact_date', weekAgo.toISOString())

  const activityMap: Record<string, number> = {}
  sellerActivity?.forEach((item) => {
    activityMap[item.seller_id] = (activityMap[item.seller_id] || 0) + 1
  })

  // Get all sellers
  const { data: allSellers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'seller')
    .eq('active', true)

  const sellerActivityArr = (allSellers || []).map((seller) => {
    const overdue = sellerOverdue[seller.id]
    return {
      seller_id: seller.id,
      seller_name: seller.full_name,
      contacts_this_week: activityMap[seller.id] || 0,
      overdue_count: overdue?.count || 0,
    }
  }).sort((a, b) => b.contacts_this_week - a.contacts_this_week)

  const metrics: DashboardMetrics = {
    clients_by_tier: clientsByTier,
    contacts_this_week: contactsThisWeek || 0,
    overdue_by_seller: overdueBySellerArr,
    total_clients: totalClients,
    total_overdue: totalOverdue || 0,
  }

  const maxTierCount = Math.max(...Object.values(metrics.clients_by_tier), 1)

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <PageHeader
          title="Dashboard"
          subtitle="Team overview"
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Total Clients"
            value={metrics.total_clients}
          />
          <StatCard
            label="Contacts This Week"
            value={metrics.contacts_this_week}
          />
          <StatCard
            label="Total Overdue"
            value={metrics.total_overdue}
            tone={metrics.total_overdue > 0 ? 'danger' : 'default'}
          />
          <StatCard
            label="Avg. Contacts/Day"
            value={(metrics.contacts_this_week / 7).toFixed(1)}
          />
        </div>

        {/* Seller Activity Table */}
        <section
          className="bg-surface p-6 mb-8"
          style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
        >
          <h2 className="label text-text-muted mb-6">Seller Activity (This Week)</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}>
                  <th className="label text-left py-3 px-3 font-semibold text-text-muted">Seller</th>
                  <th className="label text-center py-3 px-3 font-semibold text-text-muted">Contacts</th>
                  <th className="label text-center py-3 px-3 font-semibold text-text-muted">Overdue</th>
                  <th className="label text-center py-3 px-3 font-semibold text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {sellerActivityArr.map((seller) => {
                  const isInactive = seller.contacts_this_week === 0
                  const hasOverdue = seller.overdue_count > 5
                  const status = isInactive ? 'inactive' : hasOverdue ? 'warning' : 'ok'

                  return (
                    <tr
                      key={seller.seller_id}
                      style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}
                    >
                      <td className="py-4 px-3">
                        <span className="table-value text-text">{seller.seller_name}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={`metric-small ${seller.contacts_this_week === 0 ? 'text-danger' : 'text-primary'}`}>
                          {seller.contacts_this_week}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span className={`metric-small ${seller.overdue_count > 0 ? 'text-gold' : 'text-text-muted'}`}>
                          {seller.overdue_count}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Bottom Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Clients by Tier */}
          <section
            className="bg-surface p-6"
            style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
          >
            <h2 className="label text-text-muted mb-6">Clients by Tier</h2>

            <div className="space-y-4">
              {TIER_ORDER.map((tier) => {
                const count = metrics.clients_by_tier[tier]
                const percentage = (count / maxTierCount) * 100

                return (
                  <div key={tier} className="flex items-center gap-4">
                    <div className="w-24">
                      <TierBadge tier={tier} />
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-1.5 bg-bg-soft overflow-hidden"
                        style={{ borderRadius: '1px' }}
                      >
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-text">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Overdue by Seller */}
          <section
            className="bg-surface p-6"
            style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
          >
            <h2 className="label text-text-muted mb-6">Overdue by Seller</h2>

            {overdueBySellerArr.length === 0 ? (
              <p className="text-sm text-text-muted py-4">No overdue clients</p>
            ) : (
              <div className="space-y-3">
                {overdueBySellerArr.map((seller) => (
                  <div
                    key={seller.seller_id}
                    className="flex items-center justify-between py-3"
                    style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}
                  >
                    <span className="text-sm text-text">{seller.seller_name}</span>
                    <span className="text-danger font-medium">
                      {seller.overdue_count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

function StatusBadge({ status }: { status: 'inactive' | 'warning' | 'ok' }) {
  const styles = {
    inactive: 'bg-overdue-soft text-danger',
    warning: 'bg-gold-soft text-gold',
    ok: 'bg-primary-soft text-primary',
  }

  const labels = {
    inactive: 'No Activity',
    warning: 'Falling Behind',
    ok: 'On Track',
  }

  return (
    <span className={`inline-block px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
