import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell, SellerCard } from '@/components'
import { ClientTier, TIER_ORDER } from '@/lib/types'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.effectiveRole !== 'supervisor') {
    redirect('/queue')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // PARALLEL: Fetch all data at once
  const [
    { data: allSellers },
    { data: clientsData },
    { data: recentContacts },
    { data: overdueData },
    { data: contactsFeed },
  ] = await Promise.all([
    // Active sellers
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'seller')
      .eq('active', true)
      .order('full_name'),
    // All clients with seller
    supabase
      .from('clients')
      .select('id, seller_id, tier, total_spend'),
    // Contacts this week
    supabase
      .from('contacts')
      .select('seller_id')
      .gte('contact_date', weekAgo.toISOString()),
    // Overdue clients
    supabase
      .from('recontact_queue')
      .select('seller_id, days_overdue')
      .gt('days_overdue', 0),
    // Detailed contacts this week for supervisor visibility
    supabase
      .from('contacts')
      .select('id, seller_id, contact_date, channel, client:clients(id, first_name, last_name), seller:profiles(full_name)')
      .gte('contact_date', weekAgo.toISOString())
      .order('contact_date', { ascending: false })
      .limit(200),
  ])

  // Build seller stats
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

  const totalClients = clientsData?.length || 0

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-text mb-1">Team</h1>
          <p className="text-text-muted">{allSellers?.length || 0} sellers · {totalClients} clients</p>
        </div>

        {/* Seller grid */}
        {sellerStats.length === 0 ? (
          <div
            className="border bg-white py-20 text-center"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <p className="text-text-muted">No sellers found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sellerStats.map((seller) => (
              <SellerCard key={seller.id} seller={seller} tierOrder={TIER_ORDER} />
            ))}
          </div>
        )}

        <div
          id="contacts-week-all"
          className="mt-8 border bg-white p-6"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <h2 className="font-serif text-2xl text-text mb-2">Contacts this week</h2>
          <p className="text-text-muted text-sm mb-4">Who contacted whom, with channel and date.</p>
          {!(contactsFeed && contactsFeed.length > 0) ? (
            <p className="text-sm text-text-muted">No contacts logged this week.</p>
          ) : (
            <div className="space-y-2">
              {contactsFeed.map((row: any) => {
                const client = Array.isArray(row.client) ? row.client[0] : row.client
                const seller = Array.isArray(row.seller) ? row.seller[0] : row.seller
                const clientName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Client'
                const dateLabel = new Date(row.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                const channelLabel = String(row.channel || '').replace('_', ' ')
                return (
                  <div key={row.id} className="text-sm text-text-muted">
                    <Link href={client?.id ? `/clients/${client.id}` : '/clients'} className="hover:text-text transition-colors">
                      {clientName}
                    </Link>
                    {' · '}
                    {dateLabel}
                    {' · '}
                    {channelLabel}
                    {' · '}
                    <Link href={row.seller_id ? `/team/${row.seller_id}#contacts-week` : '/team'} className="hover:text-text transition-colors">
                      {seller?.full_name || 'Seller'}
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
