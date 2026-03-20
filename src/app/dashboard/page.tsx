import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge, PageHeader } from '@/components'
import { ClientTier, TIER_ORDER } from '@/lib/types'
import {
  ProgressionChart,
  IconStatCard,
  SellerActivityRadar,
  QuickActions,
} from '@/components/dashboard'
import { Users, Phone, AlertTriangle, TrendingUp, Activity } from 'lucide-react'

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

  // Build seller data for radar
  const sellerRadarData = (allSellers || []).slice(0, 4).map((seller) => {
    const contacts = activityMap[seller.id] || 0
    const overdue = sellerOverdue[seller.id]?.count || 0
    return {
      name: seller.full_name.split(' ')[0], // First name only
      contacts: contacts,
      conversions: Math.floor(contacts * 0.3), // Mock conversion rate
      followUps: Math.floor(contacts * 0.5),
      responsiveness: Math.max(20, 100 - overdue * 10),
      clientSatisfaction: Math.max(40, 95 - overdue * 5),
    }
  })

  const maxTierCount = Math.max(...Object.values(clientsByTier), 1)
  const contactsWeek = contactsThisWeek || 0
  const overdueTotal = totalOverdue || 0
  const avgPerDay = contactsWeek / 7

  // Mock progression data (in production, fetch from contacts history)
  const progressionData = [
    { month: 'Jan', value: 45, target: 50 },
    { month: 'Fév', value: 52, target: 55 },
    { month: 'Mar', value: 58, target: 60 },
    { month: 'Avr', value: 65, target: 65 },
    { month: 'Mai', value: 72, target: 70 },
    { month: 'Juin', value: contactsWeek * 4, target: 75 },
  ]

  // Determine trends
  const contactsTrend = contactsWeek > 20 ? 'up' : contactsWeek > 10 ? 'stable' : 'down'
  const overdueTrend = overdueTotal > 5 ? 'down' : overdueTotal > 0 ? 'stable' : 'up'

  let headline = ''
  let subline = ''
  if (overdueTotal > 0) {
    headline = `${overdueTotal} client${overdueTotal !== 1 ? 's' : ''} en attente de recontact.`
    subline = 'Priorisez les recontacts cette semaine — le rythme prime sur le volume.'
  } else if (contactsWeek === 0) {
    headline = 'Aucun contact enregistré ces 7 derniers jours.'
    subline = 'Vérifiez l\'activité des vendeurs avant que la file ne se calme.'
  } else {
    headline = `L'équipe a enregistré ${contactsWeek} contact${contactsWeek !== 1 ? 's' : ''} cette semaine.`
    subline = overdueTotal > 0
      ? 'Certains vendeurs ont encore des comptes en retard — voir ci-dessous.'
      : 'Aucun client en retard dans la file actuellement.'
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-7xl animate-fade-in">
        <PageHeader title="Tableau de bord" subtitle="Vision globale et rythme d'équipe" />

        {/* Headline Section - Glassmorphism */}
        <section
          className="mb-8 relative overflow-hidden p-6 md:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(252,250,246,0.98) 0%, rgba(247,244,238,0.95) 100%)',
            border: '1px solid rgba(28, 27, 25, 0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            className="absolute top-0 left-0 w-1 h-full"
            style={{
              background: overdueTotal > 0
                ? 'linear-gradient(180deg, #C34747 0%, #A48763 100%)'
                : 'linear-gradient(180deg, #0D4A3A 0%, #2F6B4F 100%)',
            }}
          />
          <p className="label mb-3 text-text-muted">CETTE SEMAINE</p>
          <h2 className="heading-2 mb-2 max-w-3xl text-text">{headline}</h2>
          <p className="body max-w-2xl text-text-soft">{subline}</p>
        </section>

        {/* Stats Grid - IconStatCards */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <IconStatCard
            icon={<Users className="w-4 h-4" strokeWidth={1.5} />}
            label="CLIENTS TOTAL"
            value={totalClients}
            subtext="Portefeuille actif"
            accentColor="#0D4A3A"
          />
          <IconStatCard
            icon={<Phone className="w-4 h-4" strokeWidth={1.5} />}
            label="CONTACTS (7J)"
            value={contactsWeek}
            subtext={`~${avgPerDay.toFixed(1)} par jour`}
            trend={contactsTrend}
            trendValue={contactsTrend === 'up' ? '+12%' : contactsTrend === 'down' ? '-8%' : '0%'}
            accentColor="#2F6B4F"
          />
          <IconStatCard
            icon={<AlertTriangle className="w-4 h-4" strokeWidth={1.5} />}
            label="EN RETARD"
            value={overdueTotal}
            subtext="À recontacter"
            trend={overdueTrend}
            trendValue={overdueTotal > 0 ? `${overdueTotal}` : '0'}
            accentColor={overdueTotal > 0 ? '#C34747' : '#6E685F'}
          />
          <IconStatCard
            icon={<TrendingUp className="w-4 h-4" strokeWidth={1.5} />}
            label="CONVERSION"
            value={`${Math.round((contactsWeek / Math.max(totalClients, 1)) * 100)}%`}
            subtext="Taux d'activité"
            trend="stable"
            trendValue="~"
            accentColor="#A48763"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Progression Chart - spans 2 columns */}
          <div className="lg:col-span-2">
            <ProgressionChart
              data={progressionData}
              title="Progression Mensuelle"
              className="h-full"
            />
          </div>

          {/* Quick Actions */}
          <QuickActions className="h-full" />
        </div>

        {/* Second Row */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Seller Activity Radar */}
          {sellerRadarData.length > 0 && (
            <SellerActivityRadar sellers={sellerRadarData} />
          )}

          {/* Clients by Tier */}
          <section
            className="p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(252,250,246,0.95) 0%, rgba(247,244,238,0.98) 100%)',
              border: '1px solid rgba(28, 27, 25, 0.06)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="label text-text-muted">RÉPARTITION PAR TIER</span>
            </div>
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
                      <div
                        className="h-2 overflow-hidden bg-bg-soft"
                        style={{ borderRadius: 2 }}
                      >
                        <div
                          className="h-full transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                            background: 'linear-gradient(90deg, #0D4A3A 0%, #2F6B4F 100%)',
                          }}
                        />
                      </div>
                    </div>
                    <span className="w-8 shrink-0 text-right text-sm font-medium text-text">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* Seller Table - Enhanced */}
        <section
          className="p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(252,250,246,0.95) 0%, rgba(247,244,238,0.98) 100%)',
            border: '1px solid rgba(28, 27, 25, 0.06)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="label text-text-muted">RYTHME DES VENDEURS</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}>
                  <th className="label py-3 pr-4 text-left font-semibold text-text-muted">Vendeur</th>
                  <th className="label py-3 px-3 text-center font-semibold text-text-muted">Contacts</th>
                  <th className="label py-3 px-3 text-center font-semibold text-text-muted">En retard</th>
                  <th className="label py-3 pl-3 text-center font-semibold text-text-muted">Statut</th>
                </tr>
              </thead>
              <tbody>
                {(allSellers || []).map((seller) => {
                  const contacts = activityMap[seller.id] || 0
                  const overdue = sellerOverdue[seller.id]?.count || 0
                  const isInactive = contacts === 0
                  const hasOverdue = overdue > 5
                  const status = isInactive ? 'inactive' : hasOverdue ? 'warning' : 'ok'

                  return (
                    <tr key={seller.id} style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}>
                      <td className="py-4 pr-4">
                        <span className="table-value text-text">{seller.full_name}</span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`metric-small ${contacts === 0 ? 'text-danger' : 'text-primary'}`}
                        >
                          {contacts}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-center">
                        <span
                          className={`metric-small ${overdue > 0 ? 'text-gold' : 'text-text-muted'}`}
                        >
                          {overdue}
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
      </div>
    </AppShell>
  )
}

function StatusBadge({ status }: { status: 'inactive' | 'warning' | 'ok' }) {
  const styles = {
    inactive: {
      bg: 'rgba(195, 71, 71, 0.08)',
      color: '#C34747',
    },
    warning: {
      bg: 'rgba(164, 135, 99, 0.12)',
      color: '#A48763',
    },
    ok: {
      bg: 'rgba(13, 74, 58, 0.08)',
      color: '#0D4A3A',
    },
  }

  const labels = {
    inactive: 'Inactif',
    warning: 'En retard',
    ok: 'En forme',
  }

  return (
    <span
      className="inline-block px-3 py-1.5 text-xs font-medium"
      style={{
        backgroundColor: styles[status].bg,
        color: styles[status].color,
      }}
    >
      {labels[status]}
    </span>
  )
}
