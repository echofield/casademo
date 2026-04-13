import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, CornerBrackets } from '@/components'
import { ClientTier } from '@/lib/types'
import {
  QuickActions,
  ComplexionDots,
  RhythmIndicator,
  SignalDistribution,
  SignalMatrix,
  ConversionMetrics,
  TierSegmentControl,
} from '@/components/dashboard'
import { ClientSignal } from '@/lib/types'
import { Users, Phone, Calendar } from 'lucide-react'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoClients, getDemoMeetings, getDemoQueue, getDemoSellerRoster } from '@/lib/demo/presentation-data'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamic imports for heavy chart components
const ProgressionChart = dynamic(
  () => import('@/components/dashboard/ProgressionChart').then(mod => ({ default: mod.ProgressionChart })),
  {
    loading: () => <div className="h-64 animate-pulse bg-[#003D2B]/5 rounded" />,
    ssr: false,
  }
)

const SellerActivityRadar = dynamic(
  () => import('@/components/dashboard/SellerActivityRadar').then(mod => ({ default: mod.SellerActivityRadar })),
  {
    loading: () => <div className="h-64 animate-pulse bg-[#003D2B]/5 rounded" />,
    ssr: false,
  }
)

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.effectiveRole !== 'supervisor') {
    redirect('/queue')
  }

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const now = new Date()
  const weekEnd = new Date()
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()))
  weekEnd.setHours(23, 59, 59, 999)

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0, 0, 0, 0)

  const failedQueries: string[] = []
  let allSellers: { id: string; full_name: string }[] = []
  let sellerOverdue: Record<string, { name: string; count: number }> = {}
  let activityMap: Record<string, number> = {}
  let sellerBreakdownData: Array<{ seller_id: string; seller_name: string; tiers: Record<ClientTier, number>; total: number }> = []
  let signalDistributionData: Array<{ seller_id: string; seller_name: string; signals: Record<ClientSignal | 'null', number>; total: number }> = []
  let sellerRadarData: Array<{ name: string; contacts: number; clients: number; ca: number; aJour: number }> = []
  let contactsWeek = 0
  let overdueTotal = 0
  let upcomingMeetingsCount = 0
  let totalClients = 0
  let progressionData: Array<{ month: string; value: number; target: number }> = []
  const clientsByTier: Record<ClientTier, number> = {
    rainbow: 0,
    optimisto: 0,
    kaizen: 0,
    idealiste: 0,
    diplomatico: 0,
    grand_prix: 0,
  }

  if (isDemoMode) {
    const demoClients = getDemoClients()
    const demoQueue = getDemoQueue('supervisor')
    const demoMeetings = getDemoMeetings('supervisor')
    allSellers = getDemoSellerRoster().filter((seller) => seller.active).map((seller) => ({ id: seller.id, full_name: seller.full_name }))

    totalClients = demoClients.length
    demoClients.forEach((client) => {
      clientsByTier[client.tier] += 1
      const monthlyContacts = (client.contact_history || []).filter((contact) => new Date(contact.date) >= monthStart)
      activityMap[client.seller_id] = (activityMap[client.seller_id] || 0) + monthlyContacts.length
    })

    contactsWeek = demoClients.flatMap((client) => client.contact_history || []).filter((contact) => new Date(contact.date) >= weekAgo).length
    overdueTotal = demoQueue.filter((item) => item.days_overdue > 0).length
    upcomingMeetingsCount = demoMeetings.filter((meeting) => meeting.status === 'scheduled' && new Date(meeting.start_time) >= now && new Date(meeting.start_time) <= weekEnd).length

    demoQueue.filter((item) => item.days_overdue > 0).forEach((item) => {
      if (!sellerOverdue[item.seller_id]) {
        sellerOverdue[item.seller_id] = { name: item.seller_name, count: 0 }
      }
      sellerOverdue[item.seller_id].count++
    })

    const sellerTierMap: Record<string, { name: string; tiers: Record<ClientTier, number>; total: number }> = {}
    const sellerSignalMap: Record<string, { name: string; signals: Record<ClientSignal | 'null', number>; total: number }> = {}

    allSellers.forEach((seller) => {
      sellerTierMap[seller.id] = {
        name: seller.full_name,
        tiers: { rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0 },
        total: 0,
      }
      sellerSignalMap[seller.id] = {
        name: seller.full_name,
        signals: { very_hot: 0, hot: 0, warm: 0, cold: 0, lost: 0, null: 0 },
        total: 0,
      }
    })

    demoClients.forEach((client) => {
      if (sellerTierMap[client.seller_id]) {
        sellerTierMap[client.seller_id].tiers[client.tier]++
        sellerTierMap[client.seller_id].total++
      }
      if (sellerSignalMap[client.seller_id]) {
        const signalKey = (client.seller_signal || 'null') as ClientSignal | 'null'
        sellerSignalMap[client.seller_id].signals[signalKey]++
        sellerSignalMap[client.seller_id].total++
      }
    })

    sellerBreakdownData = Object.entries(sellerTierMap)
      .map(([seller_id, data]) => ({ seller_id, seller_name: data.name, tiers: data.tiers, total: data.total }))
      .filter((seller) => seller.total > 0)
      .sort((a, b) => b.total - a.total)

    signalDistributionData = Object.entries(sellerSignalMap)
      .map(([seller_id, data]) => ({ seller_id, seller_name: data.name, signals: data.signals, total: data.total }))
      .filter((seller) => seller.total > 0)
      .sort((a, b) => b.total - a.total)

    sellerRadarData = allSellers
      .map((seller) => {
        const sellerClients = demoClients.filter((client) => client.seller_id === seller.id)
        const overdue = sellerOverdue[seller.id]?.count || 0
        const totalCA = sellerClients.reduce((sum, client) => sum + client.total_spend, 0)
        const clientCount = sellerClients.length
        const aJourPct = clientCount > 0 ? Math.round(((clientCount - overdue) / clientCount) * 100) : 100
        return {
          name: seller.full_name.split(' ')[0],
          contacts: activityMap[seller.id] || 0,
          clients: clientCount,
          ca: totalCA,
          aJour: aJourPct,
        }
      })
      .filter((seller) => seller.clients > 0)

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const contactGoalPct = 70
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const uniqueClientsContacted = new Set(
        demoClients
          .flatMap((client) => (client.contact_history || []).map((contact) => ({ contact_date: contact.date, client_id: client.id })))
          .filter((contact) => {
            const contactDate = new Date(contact.contact_date)
            return contactDate >= mStart && contactDate <= mEnd
          })
          .map((contact) => contact.client_id)
      ).size

      progressionData.push({
        month: monthNames[mStart.getMonth()],
        value: totalClients > 0 ? Math.round((uniqueClientsContacted / totalClients) * 100) : 0,
        target: contactGoalPct,
      })
    }
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const queryResults = await Promise.allSettled([
      supabase.from('clients').select('tier'),
      supabase.from('recontact_queue').select('seller_id, seller_name, days_overdue', { count: 'exact' }).gt('days_overdue', 0),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).gte('contact_date', weekAgo.toISOString()),
      supabase.from('contacts').select('seller_id').gte('contact_date', monthStart.toISOString()),
      supabase.from('profiles').select('id, full_name').eq('role', 'seller').eq('active', true),
      supabase.from('clients').select('seller_id, tier, total_spend'),
      supabase.from('clients').select('seller_id, seller_signal'),
      supabase.from('contacts').select('contact_date, client_id').gte('contact_date', sixMonthsAgo.toISOString()).order('contact_date', { ascending: true }),
      supabase.from('meetings').select('id', { count: 'exact', head: true }).gte('start_time', now.toISOString()).lte('start_time', weekEnd.toISOString()).eq('status', 'scheduled'),
    ])

    const queryNames = ['tierCounts', 'overdueData', 'contactsThisWeek', 'sellerActivity', 'allSellers', 'clientsWithSeller', 'clientSignals', 'monthlyContacts', 'upcomingMeetings']
    const getSettled = <T,>(result: PromiseSettledResult<T>, name: string, fallback: T): T => {
      if (result.status === 'rejected') {
        failedQueries.push(name)
        console.error(`[Dashboard] Query failed: ${name}`, result.reason)
        return fallback
      }
      return result.value
    }

    const tierCountsResult = getSettled(queryResults[0] as PromiseSettledResult<{ data: { tier: string | null }[] | null }>, queryNames[0], { data: null })
    const overdueResult = getSettled(queryResults[1] as PromiseSettledResult<{ data: { seller_id: string; seller_name: string | null; days_overdue: number }[] | null; count: number | null }>, queryNames[1], { data: null, count: null })
    const contactsWeekResult = getSettled(queryResults[2] as PromiseSettledResult<{ count: number | null }>, queryNames[2], { count: null })
    const sellerActivityResult = getSettled(queryResults[3] as PromiseSettledResult<{ data: { seller_id: string }[] | null }>, queryNames[3], { data: null })
    const allSellersResult = getSettled(queryResults[4] as PromiseSettledResult<{ data: { id: string; full_name: string }[] | null }>, queryNames[4], { data: null })
    const clientsWithSellerResult = getSettled(queryResults[5] as PromiseSettledResult<{ data: { seller_id: string; tier: string | null; total_spend: number | null }[] | null }>, queryNames[5], { data: null })
    const clientSignalsResult = getSettled(queryResults[6] as PromiseSettledResult<{ data: { seller_id: string; seller_signal: string | null }[] | null }>, queryNames[6], { data: null })
    const monthlyContactsResult = getSettled(queryResults[7] as PromiseSettledResult<{ data: { contact_date: string; client_id: string }[] | null }>, queryNames[7], { data: null })
    const upcomingMeetingsResult = getSettled(queryResults[8] as PromiseSettledResult<{ count: number | null }>, queryNames[8], { count: null })

    const tierCounts = tierCountsResult.data
    const overdueData = overdueResult.data
    const sellerActivity = sellerActivityResult.data
    const clientsWithSeller = clientsWithSellerResult.data
    const clientSignals = clientSignalsResult.data
    const monthlyContacts = monthlyContactsResult.data

    allSellers = allSellersResult.data || []
    tierCounts?.forEach((client) => {
      if (client.tier) clientsByTier[client.tier as ClientTier]++
    })
    totalClients = tierCounts?.length || 0
    overdueTotal = overdueResult.count || 0
    contactsWeek = contactsWeekResult.count || 0
    upcomingMeetingsCount = upcomingMeetingsResult.count || 0

    overdueData?.forEach((item) => {
      if (!sellerOverdue[item.seller_id]) {
        sellerOverdue[item.seller_id] = { name: item.seller_name || 'Unknown', count: 0 }
      }
      sellerOverdue[item.seller_id].count++
    })

    sellerActivity?.forEach((item) => {
      activityMap[item.seller_id] = (activityMap[item.seller_id] || 0) + 1
    })

    const sellerTierMap: Record<string, { name: string; tiers: Record<ClientTier, number>; total: number }> = {}
    allSellers.forEach((seller) => {
      sellerTierMap[seller.id] = {
        name: seller.full_name,
        tiers: { rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0 },
        total: 0,
      }
    })
    ;(clientsWithSeller || []).forEach((client) => {
      if (sellerTierMap[client.seller_id]) {
        sellerTierMap[client.seller_id].tiers[client.tier as ClientTier]++
        sellerTierMap[client.seller_id].total++
      }
    })

    sellerBreakdownData = Object.entries(sellerTierMap)
      .map(([seller_id, data]) => ({ seller_id, seller_name: data.name, tiers: data.tiers, total: data.total }))
      .filter((seller) => seller.total > 0)
      .sort((a, b) => b.total - a.total)

    const sellerSignalMap: Record<string, { name: string; signals: Record<ClientSignal | 'null', number>; total: number }> = {}
    allSellers.forEach((seller) => {
      sellerSignalMap[seller.id] = {
        name: seller.full_name,
        signals: { very_hot: 0, hot: 0, warm: 0, cold: 0, lost: 0, null: 0 },
        total: 0,
      }
    })
    ;(clientSignals || []).forEach((client) => {
      if (sellerSignalMap[client.seller_id]) {
        const signalKey = (client.seller_signal || 'null') as ClientSignal | 'null'
        sellerSignalMap[client.seller_id].signals[signalKey]++
        sellerSignalMap[client.seller_id].total++
      }
    })

    signalDistributionData = Object.entries(sellerSignalMap)
      .map(([seller_id, data]) => ({ seller_id, seller_name: data.name, signals: data.signals, total: data.total }))
      .filter((seller) => seller.total > 0)
      .sort((a, b) => b.total - a.total)

    sellerRadarData = allSellers
      .slice(0, 4)
      .map((seller) => {
        const contacts = activityMap[seller.id] || 0
        const overdue = sellerOverdue[seller.id]?.count || 0
        const sellerClients = (clientsWithSeller || []).filter((client) => client.seller_id === seller.id)
        const clientCount = sellerClients.length
        const totalCA = sellerClients.reduce((sum, client) => sum + (client.total_spend || 0), 0)
        const aJourPct = clientCount > 0 ? Math.round(((clientCount - overdue) / clientCount) * 100) : 100

        return {
          name: seller.full_name.split(' ')[0],
          contacts,
          clients: clientCount,
          ca: totalCA,
          aJour: aJourPct,
        }
      })
      .filter((seller) => seller.clients > 0)

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const contactGoalPct = 70
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      const uniqueClientsContacted = new Set(
        (monthlyContacts || [])
          .filter((contact) => {
            const contactDate = new Date(contact.contact_date)
            return contactDate >= mStart && contactDate <= mEnd
          })
          .map((contact) => contact.client_id)
      ).size

      progressionData.push({
        month: monthNames[mStart.getMonth()],
        value: totalClients > 0 ? Math.round((uniqueClientsContacted / totalClients) * 100) : 0,
        target: contactGoalPct,
      })
    }
  }

  const isDegraded = !isDemoMode && failedQueries.length > 0

  // Greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user.profile.full_name.split(' ')[0]

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-7xl">
        {/* Degraded mode indicator - subtle, for operator awareness */}
        {isDegraded && (
          <div className="mb-4 px-3 py-2 text-xs text-text-muted bg-amber-50/50 border border-amber-200/30 rounded">
            Some dashboard data may be incomplete. Refresh to retry.
          </div>
        )}

        {/* Greeting header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-text tracking-tight">
            {greeting}, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-text-soft mt-1">
            Here's your team's pulse today.
          </p>
        </div>

        {/* Essence Summary - the one thing that matters */}
        <section className="mt-8 mb-10">
          <div
            className="p-8 md:p-10 relative overflow-hidden"
            style={{
              background: 'var(--paper)',
              border: '0.5px solid var(--faint)',
              borderRadius: '2px',
            }}
          >
            {/* SYMI corner brackets */}
            <CornerBrackets size="lg" opacity={0.4} />

            {/* Subtle accent bar */}
            <div
              className="absolute top-0 left-0 w-full h-0.5"
              style={{
                background: overdueTotal > 10
                  ? 'linear-gradient(90deg, #C34747 0%, #D97706 50%, #A38767 100%)'
                  : overdueTotal > 0
                  ? 'linear-gradient(90deg, #A38767 0%, #2F6B4F 100%)'
                  : 'linear-gradient(90deg, #1B4332 0%, #2F6B4F 100%)',
              }}
            />

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs tracking-widest text-text-muted uppercase">
                  Next step
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-text mt-2 leading-snug">
                  {overdueTotal > 0 ? (
                    <>
                      <span className="text-gold">{overdueTotal}</span> client{overdueTotal !== 1 ? 's' : ''} need{overdueTotal === 1 ? 's' : ''} your attention.
                    </>
                  ) : (
                    <>
                      Team is up to date. <span className="text-primary">Keep it up.</span>
                    </>
                  )}
                </h2>
                {overdueTotal > 0 && (
                  <Link
                    href="/queue"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-medium tracking-wide transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'var(--green)',
                      color: 'var(--paper)',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-serif)',
                      boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.1)',
                    }}
                  >
                    WORK THE QUEUE
                  </Link>
                )}
              </div>

              {/* Quick stats - dots visualization */}
              <div className="grid grid-cols-2 gap-6">
                <StatPill
                  label="Portfolio"
                  value={totalClients}
                  icon={<Users className="w-4 h-4" strokeWidth={1.5} />}
                />
                <StatPill
                  label="Contacts (7d)"
                  value={contactsWeek}
                  icon={<Phone className="w-4 h-4" strokeWidth={1.5} />}
                  subtext={contactsWeek > 0 ? `~${(contactsWeek / 7).toFixed(1)}/day` : 'No activity yet'}
                  href="/team#contacts-week-all"
                />
                <StatPill
                  label="Overdue"
                  value={overdueTotal}
                  variant={overdueTotal > 10 ? 'warning' : overdueTotal > 0 ? 'caution' : 'good'}
                />
                <StatPill
                  label="Next appt"
                  value={upcomingMeetingsCount || 0}
                  icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
                  subtext="this week"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Signal Overview â€” second block, first-class feature */}
        {signalDistributionData.length > 0 && (
          <>
            <SignalMatrix
              sellers={signalDistributionData}
              className="mb-6"
            />
            <SignalDistribution
              sellers={signalDistributionData}
              className="mb-10"
            />
          </>
        )}

        {/* Casa One Impact â€” conversion metrics */}
        <ConversionMetrics className="mb-10" />

        {/* Two column layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          {/* Progression Chart - 2 cols */}
          <div className="lg:col-span-2">
            <ProgressionChart
              data={progressionData}
              title="Portfolio Contact Rate"
              className="h-full"
            />
          </div>

          {/* Quick Actions */}
          <QuickActions className="h-full" />
        </div>

        {/* Seller Rhythm Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <RhythmIndicator activity={contactsWeek / 50} />
            <h2 className="font-serif text-xl text-text">Team Rhythm</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Seller Activity Radar */}
            {sellerRadarData.length > 0 && (
              <SellerActivityRadar sellers={sellerRadarData} />
            )}

            {/* Seller Rhythm Cards */}
            <div
              className="p-6 relative"
              style={{
                background: 'var(--paper)',
                border: '0.5px solid var(--faint)',
                borderRadius: '2px',
              }}
            >
              <CornerBrackets size="md" opacity={0.3} />
              <span className="label text-text-muted mb-4 block">ACTIVITY THIS MONTH</span>
              <div className="space-y-4">
                {(allSellers || []).slice(0, 5).map((seller) => {
                  const contacts = activityMap[seller.id] || 0
                  const overdue = sellerOverdue[seller.id]?.count || 0
                  const maxContacts = Math.max(15, ...Object.values(activityMap))

                  return (
                    <div
                      key={seller.id}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: '0.5px solid var(--faint)' }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 flex items-center justify-center font-serif text-lg"
                          style={{
                            backgroundColor: 'var(--green-soft)',
                            color: 'var(--green)',
                            borderRadius: '2px',
                          }}
                        >
                          {seller.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-serif text-text">{seller.full_name}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <ComplexionDots
                              value={contacts}
                              max={maxContacts}
                              dots={6}
                              size="sm"
                              color="#1B4332"
                            />
                            <Link
                              href={`/team/${seller.id}#contacts-week`}
                              className="text-xs text-text-muted hover:text-primary transition-colors"
                            >
                              {contacts} contacts
                            </Link>
                          </div>
                        </div>
                      </div>
                      {overdue > 0 && (
                        <div className="flex items-center gap-2">
                          <ComplexionDots
                            value={overdue}
                            max={10}
                            dots={5}
                            size="sm"
                            inverted
                          />
                          <span className="text-xs text-gold">{overdue} overdue</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Tier Distribution + Seller Breakdown (interactive) */}
        <div className="mb-10">
          <TierSegmentControl
            clientsByTier={clientsByTier}
            sellers={sellerBreakdownData}
          />
        </div>

      </div>
    </AppShell>
  )
}

// Minimal stat pill component - SYMI style
function StatPill({
  label,
  value,
  icon,
  subtext,
  href,
  variant = 'neutral',
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  subtext?: string
  href?: string
  variant?: 'neutral' | 'good' | 'caution' | 'warning'
}) {
  const colors = {
    neutral: { text: 'var(--ink)', bg: 'rgba(26, 26, 26, 0.03)' },
    good: { text: 'var(--green)', bg: 'rgba(27, 67, 50, 0.05)' },
    caution: { text: 'var(--gold)', bg: 'rgba(163, 135, 103, 0.08)' },
    warning: { text: 'var(--danger)', bg: 'rgba(195, 71, 71, 0.06)' },
  }

  const content = (
    <div
      className="p-4"
      style={{
        backgroundColor: colors[variant].bg,
        borderRadius: '2px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span style={{ color: colors[variant].text }}>{icon}</span>}
        <span className="text-xs tracking-wide text-text-muted uppercase">{label}</span>
      </div>
      <div
        className="font-serif text-2xl"
        style={{ color: colors[variant].text }}
      >
        {value}
      </div>
      {subtext && (
        <span className="text-xs text-text-muted">{subtext}</span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    )
  }

  return content
}





