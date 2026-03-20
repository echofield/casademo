import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge, PageHeader } from '@/components'
import { ClientTier, TIER_ORDER } from '@/lib/types'
import {
  ProgressionChart,
  SellerActivityRadar,
  QuickActions,
  ComplexionDots,
  RhythmIndicator,
  HealthBar,
} from '@/components/dashboard'
import { Users, Phone, Calendar, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
      name: seller.full_name.split(' ')[0],
      contacts: contacts,
      conversions: Math.floor(contacts * 0.3),
      followUps: Math.floor(contacts * 0.5),
      responsiveness: Math.max(20, 100 - overdue * 10),
      clientSatisfaction: Math.max(40, 95 - overdue * 5),
    }
  })

  const maxTierCount = Math.max(...Object.values(clientsByTier), 1)
  const contactsWeek = contactsThisWeek || 0
  const overdueTotal = totalOverdue || 0

  // Mock progression data
  const progressionData = [
    { month: 'Jan', value: 45, target: 50 },
    { month: 'Fév', value: 52, target: 55 },
    { month: 'Mar', value: 58, target: 60 },
    { month: 'Avr', value: 65, target: 65 },
    { month: 'Mai', value: 72, target: 70 },
    { month: 'Juin', value: contactsWeek * 4, target: 75 },
  ]

  // Greeting based on time
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'
  const firstName = user.profile.full_name.split(' ')[0]

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-7xl">
        {/* Greeting header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-text tracking-tight">
            {greeting}, <span className="text-primary">{firstName}</span>
          </h1>
          <p className="text-text-soft mt-1">
            Voici le pouls de votre équipe aujourd'hui.
          </p>
        </div>

        {/* Essence Summary - the one thing that matters */}
        <section className="mt-8 mb-10">
          <div
            className="p-8 md:p-10 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(252,250,246,0.98) 0%, rgba(247,244,238,0.95) 100%)',
              borderRadius: '2px',
            }}
          >
            {/* Subtle accent bar */}
            <div
              className="absolute top-0 left-0 w-full h-1"
              style={{
                background: overdueTotal > 10
                  ? 'linear-gradient(90deg, #C34747 0%, #D97706 50%, #A48763 100%)'
                  : overdueTotal > 0
                  ? 'linear-gradient(90deg, #A48763 0%, #2F6B4F 100%)'
                  : 'linear-gradient(90deg, #0D4A3A 0%, #2F6B4F 100%)',
              }}
            />

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs tracking-widest text-text-muted uppercase">
                  Prochaine étape
                </span>
                <h2 className="font-serif text-2xl md:text-3xl text-text mt-2 leading-snug">
                  {overdueTotal > 0 ? (
                    <>
                      <span className="text-gold">{overdueTotal}</span> client{overdueTotal !== 1 ? 's' : ''} attend{overdueTotal !== 1 ? 'ent' : ''} votre attention.
                    </>
                  ) : (
                    <>
                      L'équipe est à jour. <span className="text-primary">Continuez ainsi.</span>
                    </>
                  )}
                </h2>
                {overdueTotal > 0 && (
                  <Link
                    href="/queue"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-primary text-white text-sm font-medium tracking-wide transition-all duration-200 hover:bg-primary-soft"
                    style={{ borderRadius: '2px' }}
                  >
                    TRAVAILLER LA FILE
                  </Link>
                )}
              </div>

              {/* Quick stats - dots visualization */}
              <div className="grid grid-cols-2 gap-6">
                <StatPill
                  label="Portefeuille"
                  value={totalClients}
                  icon={<Users className="w-4 h-4" strokeWidth={1.5} />}
                />
                <StatPill
                  label="Contacts (7j)"
                  value={contactsWeek}
                  icon={<Phone className="w-4 h-4" strokeWidth={1.5} />}
                  subtext={`~${(contactsWeek / 7).toFixed(1)}/jour`}
                />
                <StatPill
                  label="En attente"
                  value={overdueTotal}
                  variant={overdueTotal > 10 ? 'warning' : overdueTotal > 0 ? 'caution' : 'good'}
                />
                <StatPill
                  label="Prochain RDV"
                  value={2}
                  icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
                  subtext="cette semaine"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-3 gap-8 mb-10">
          {/* Progression Chart - 2 cols */}
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

        {/* Seller Rhythm Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <RhythmIndicator activity={contactsWeek / 50} />
            <h2 className="font-serif text-xl text-text">Rythme de l'équipe</h2>
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
                background: 'linear-gradient(145deg, rgba(252,250,246,0.95) 0%, rgba(247,244,238,0.98) 100%)',
                borderRadius: '2px',
              }}
            >
              <span className="label text-text-muted mb-4 block">ACTIVITÉ INDIVIDUELLE</span>
              <div className="space-y-4">
                {(allSellers || []).slice(0, 5).map((seller) => {
                  const contacts = activityMap[seller.id] || 0
                  const overdue = sellerOverdue[seller.id]?.count || 0
                  const maxContacts = 15

                  return (
                    <div
                      key={seller.id}
                      className="flex items-center justify-between py-3"
                      style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg"
                          style={{
                            backgroundColor: 'rgba(13, 74, 58, 0.08)',
                            color: '#0D4A3A',
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
                              color="#0D4A3A"
                            />
                            <span className="text-xs text-text-muted">{contacts} contacts</span>
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
                          <span className="text-xs text-gold">{overdue} en retard</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Tier Distribution */}
        <section
          className="p-6 md:p-8 mb-10"
          style={{
            background: 'linear-gradient(145deg, rgba(252,250,246,0.95) 0%, rgba(247,244,238,0.98) 100%)',
            borderRadius: '2px',
          }}
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="label text-text-muted">RÉPARTITION PAR TIER</span>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TIER_ORDER.map((tier) => {
              const count = clientsByTier[tier]

              return (
                <div key={tier} className="flex items-center gap-4">
                  <div className="w-28 shrink-0">
                    <TierBadge tier={tier} />
                  </div>
                  <div className="flex-1">
                    <HealthBar
                      value={count}
                      max={maxTierCount}
                      variant="good"
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right font-serif text-lg text-text">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

// Minimal stat pill component
function StatPill({
  label,
  value,
  icon,
  subtext,
  variant = 'neutral',
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  subtext?: string
  variant?: 'neutral' | 'good' | 'caution' | 'warning'
}) {
  const colors = {
    neutral: { text: '#1C1B19', bg: 'rgba(28, 27, 25, 0.03)' },
    good: { text: '#0D4A3A', bg: 'rgba(13, 74, 58, 0.05)' },
    caution: { text: '#A48763', bg: 'rgba(164, 135, 99, 0.08)' },
    warning: { text: '#C34747', bg: 'rgba(195, 71, 71, 0.06)' },
  }

  return (
    <div
      className="p-4 rounded-sm"
      style={{ backgroundColor: colors[variant].bg }}
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
}
