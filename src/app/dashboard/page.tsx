import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import { DashboardMetrics, TIER_ORDER, ClientTier } from '@/lib/types'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Only supervisors can access dashboard
  if (user.profile.role !== 'supervisor') {
    redirect('/queue')
  }

  // Metrics from Supabase only (do not fetch own /api/dashboard from the server:
  // on Vercel, NEXT_PUBLIC_SITE_URL is often unset → localhost fetch throws and breaks RSC.)
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

  // Get seller activity (contacts per seller this week)
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
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="mb-2">Dashboard</h1>
          <p className="text-ink/60">Supervisor overview</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <p className="small-caps text-ink/60 mb-1">Total Clients</p>
            <p className="font-serif text-3xl text-green">{metrics.total_clients}</p>
          </div>
          <div className="card text-center">
            <p className="small-caps text-ink/60 mb-1">Contacts This Week</p>
            <p className="font-serif text-3xl text-green">{metrics.contacts_this_week}</p>
          </div>
          <div className="card text-center">
            <p className="small-caps text-ink/60 mb-1">Total Overdue</p>
            <p className={`font-serif text-3xl ${metrics.total_overdue > 0 ? 'text-red-600' : 'text-green'}`}>
              {metrics.total_overdue}
            </p>
          </div>
          <div className="card text-center">
            <p className="small-caps text-ink/60 mb-1">Avg. Contacts/Day</p>
            <p className="font-serif text-3xl text-green">
              {(metrics.contacts_this_week / 7).toFixed(1)}
            </p>
          </div>
        </div>

        {/* Seller Activity - Primary Section */}
        <section className="card mb-6">
          <h2 className="small-caps text-ink/60 mb-6">Seller Activity (This Week)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-grey-light">
                  <th className="small-caps text-left py-2 px-2 font-normal">Seller</th>
                  <th className="small-caps text-center py-2 px-2 font-normal">Contacts</th>
                  <th className="small-caps text-center py-2 px-2 font-normal">Overdue</th>
                  <th className="small-caps text-center py-2 px-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {sellerActivityArr.map((seller) => {
                  const isInactive = seller.contacts_this_week === 0
                  const hasOverdue = seller.overdue_count > 5
                  const status = isInactive ? 'inactive' : hasOverdue ? 'warning' : 'ok'

                  return (
                    <tr key={seller.seller_id} className="border-b border-grey-light/50">
                      <td className="py-3 px-2">
                        <span className="font-medium">{seller.seller_name}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-serif text-lg ${seller.contacts_this_week === 0 ? 'text-red-600' : 'text-green'}`}>
                          {seller.contacts_this_week}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`font-serif text-lg ${seller.overdue_count > 0 ? 'text-amber-600' : 'text-ink/40'}`}>
                          {seller.overdue_count}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {status === 'inactive' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            No Activity
                          </span>
                        )}
                        {status === 'warning' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            Falling Behind
                          </span>
                        )}
                        {status === 'ok' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green/10 text-green text-xs rounded">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            On Track
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Clients by Tier */}
          <section className="card">
            <h2 className="small-caps text-ink/60 mb-6">Clients by Tier</h2>
            <div className="space-y-4">
              {TIER_ORDER.map((tier) => {
                const count = metrics.clients_by_tier[tier]
                const percentage = (count / maxTierCount) * 100

                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between mb-1">
                      <TierBadge tier={tier} />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-grey-light rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Recent Activity Feed */}
          <section className="card">
            <h2 className="small-caps text-ink/60 mb-6">Team Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-grey-light/50">
                <span className="text-sm text-ink/60">Daily Target</span>
                <span className="font-medium">5 contacts/seller</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-grey-light/50">
                <span className="text-sm text-ink/60">Weekly Target</span>
                <span className="font-medium">25 contacts/seller</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-grey-light/50">
                <span className="text-sm text-ink/60">Team Avg (This Week)</span>
                <span className={`font-medium ${(metrics.contacts_this_week / (allSellers?.length || 1)) >= 25 ? 'text-green' : 'text-amber-600'}`}>
                  {(metrics.contacts_this_week / (allSellers?.length || 1)).toFixed(1)} contacts
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink/60">Total Overdue</span>
                <span className={`font-medium ${metrics.total_overdue > 0 ? 'text-red-600' : 'text-green'}`}>
                  {metrics.total_overdue} clients
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
