import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell, TeamAlerts, SellerCard } from '@/components'
import { ClientTier, TIER_ORDER } from '@/lib/types'
import {
  SellerActivityRadar,
  SellerTierBreakdown,
} from '@/components/dashboard'
import type { SellerRadarData } from '@/components/dashboard/SellerActivityRadar'
import { Users, AlertCircle, TrendingUp, Activity, Euro, Bell } from 'lucide-react'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.effectiveRole !== 'supervisor') {
    redirect('/queue')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()


  // Fetch all active sellers
  const { data: allSellers } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'seller')
    .eq('active', true)
    .order('full_name')

  // Fetch all clients with their seller
  const { data: clientsData } = await supabase
    .from('clients')
    .select('id, seller_id, tier, total_spend')
    

  // Fetch recent contacts (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const { data: recentContacts } = await supabase
    .from('contacts')
    .select('seller_id')
    .gte('contact_date', weekAgo.toISOString())

  // Fetch overdue clients from recontact_queue
  const { data: overdueData } = await supabase
    .from('recontact_queue')
    .select('seller_id, days_overdue')
    
    .gt('days_overdue', 0)

  // Build seller stats with REAL data only
  const sellerStats = (allSellers || []).map(seller => {
    const clients = (clientsData || []).filter(c => c.seller_id === seller.id)
    const contacts = (recentContacts || []).filter(c => c.seller_id === seller.id).length
    const overdueClients = (overdueData || []).filter(c => c.seller_id === seller.id)
    const overdueCount = overdueClients.length
    const totalSpend = clients.reduce((sum, c) => sum + (c.total_spend || 0), 0)

    // % of clients that are NOT overdue
    const aJourPct = clients.length > 0
      ? Math.round(((clients.length - overdueCount) / clients.length) * 100)
      : 100

    // Tier breakdown
    const tiers: Record<ClientTier, number> = {
      rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0
    }
    clients.forEach(c => {
      if (c.tier && tiers[c.tier as ClientTier] !== undefined) {
        tiers[c.tier as ClientTier]++
      }
    })

    return {
      id: seller.id,
      name: seller.full_name,
      clientCount: clients.length,
      contactsWeek: contacts,
      overdueCount,
      totalSpend,
      aJourPct,
      tiers,
    }
  })

  // Build radar data with REAL metrics only
  const radarData: SellerRadarData[] = sellerStats
    .filter(s => s.clientCount > 0)
    .sort((a, b) => b.clientCount - a.clientCount)
    .slice(0, 4)
    .map(s => ({
      name: s.name.split(' ')[0],
      contacts: s.contactsWeek,
      clients: s.clientCount,
      ca: s.totalSpend,
      aJour: s.aJourPct,
    }))

  // Alerts - only factual issues
  const inactiveSellers = sellerStats.filter(s => s.contactsWeek === 0 && s.clientCount > 0)
  const highOverdueSellers = sellerStats.filter(s => s.overdueCount >= 5)

  // Seller breakdown for the component
  const sellerBreakdownData = sellerStats
    .filter(s => s.clientCount > 0)
    .map(s => ({
      seller_id: s.id,
      seller_name: s.name,
      tiers: s.tiers,
      total: s.clientCount,
    }))
    .sort((a, b) => b.total - a.total)

  const totalClients = clientsData?.length || 0
  const totalOverdue = overdueData?.length || 0
  const totalContacts = recentContacts?.length || 0
  const totalCA = sellerStats.reduce((sum, s) => sum + s.totalSpend, 0)

  const formatCurrency = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k€`
    }
    return `${amount}€`
  }

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl md:text-4xl text-text tracking-tight">
            Team Overview
          </h1>
          <p className="text-text-soft mt-1">
            {allSellers?.length || 0} sellers · {totalClients} clients
          </p>
        </div>

        {/* Quick stats - all factual */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <QuickStat
            label="Active sellers"
            value={allSellers?.length || 0}
            icon={<Users className="w-4 h-4" />}
          />
          <QuickStat
            label="Total clients"
            value={totalClients}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <QuickStat
            label="Contacts (7d)"
            value={totalContacts}
            icon={<Activity className="w-4 h-4" />}
          />
          <QuickStat
            label="Overdue"
            value={totalOverdue}
            icon={<AlertCircle className="w-4 h-4" />}
            variant={totalOverdue > 10 ? 'warning' : totalOverdue > 0 ? 'caution' : 'good'}
          />
        </div>

        {/* Alerts section - only if there are real issues */}
        {(inactiveSellers.length > 0 || highOverdueSellers.length > 0) && (
          <section
            className="p-6 mb-8 relative"
            style={{
              background: 'rgba(163, 135, 103, 0.06)',
              border: '0.5px solid rgba(163, 135, 103, 0.25)',
              borderRadius: '2px',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-gold" strokeWidth={1.5} />
              <span className="label text-gold">TEAM ALERTS</span>
            </div>
            <div className="space-y-2">
              {inactiveSellers.map(s => (
                <p key={s.id} className="text-sm text-text">
                  <strong>{s.name}</strong> — 0 contacts this week ({s.clientCount} clients)
                </p>
              ))}
              {highOverdueSellers.map(s => (
                <p key={s.id} className="text-sm text-text">
                  <strong>{s.name}</strong> — {s.overdueCount} clients overdue
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Two column layout: Radar + Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Radar chart - factual data */}
          <SellerActivityRadar sellers={radarData} />

          {/* Seller breakdown */}
          <SellerTierBreakdown sellers={sellerBreakdownData} />
        </div>

        {/* Individual seller cards */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" strokeWidth={1.5} />
            <span className="label text-text-muted">SELLER DETAILS</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerStats.map((seller) => (
              <SellerCard key={seller.id} seller={seller} tierOrder={TIER_ORDER} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  )
}

function QuickStat({
  label,
  value,
  icon,
  variant = 'neutral',
}: {
  label: string
  value: number
  icon: React.ReactNode
  variant?: 'neutral' | 'good' | 'caution' | 'warning'
}) {
  const colors = {
    neutral: { text: 'var(--ink)', bg: 'rgba(26, 26, 26, 0.03)' },
    good: { text: 'var(--green)', bg: 'rgba(27, 67, 50, 0.05)' },
    caution: { text: 'var(--gold)', bg: 'rgba(163, 135, 103, 0.08)' },
    warning: { text: 'var(--danger)', bg: 'rgba(195, 71, 71, 0.06)' },
  }

  return (
    <div
      className="p-4"
      style={{
        backgroundColor: colors[variant].bg,
        borderRadius: '2px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: colors[variant].text }}>{icon}</span>
        <span className="text-xs tracking-wide text-text-muted uppercase">{label}</span>
      </div>
      <div
        className="font-serif text-2xl"
        style={{ color: colors[variant].text }}
      >
        {value}
      </div>
    </div>
  )
}
