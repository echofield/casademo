import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import { DashboardMetrics, TIER_ORDER, TIER_LABELS, ClientTier } from '@/lib/types'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Only supervisors can access dashboard
  if (user.profile.role !== 'supervisor') {
    redirect('/queue')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002'}/api/dashboard`, {
    headers: {
      cookie: '', // Will be handled by middleware
    },
    cache: 'no-store',
  })

  // Fetch metrics directly from Supabase since we're server-side
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

          {/* Overdue by Seller */}
          <section className="card">
            <h2 className="small-caps text-ink/60 mb-6">Overdue by Seller</h2>
            {metrics.overdue_by_seller.length > 0 ? (
              <div className="space-y-3">
                {metrics.overdue_by_seller.map((seller) => (
                  <div
                    key={seller.seller_id}
                    className="flex items-center justify-between py-2 border-b border-grey-light/50 last:border-0"
                  >
                    <span className="text-sm">{seller.seller_name}</span>
                    <span className={`font-medium ${seller.overdue_count > 0 ? 'text-red-600' : 'text-green'}`}>
                      {seller.overdue_count} overdue
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-ink/40 text-sm">No overdue clients</p>
                <p className="narrator mt-2">Team is on track</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
