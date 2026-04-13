import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, SellerCard } from '@/components'
import { ClientTier, TIER_ORDER } from '@/lib/types'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoClients, getDemoSellerSummaries } from '@/lib/demo/presentation-data'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.effectiveRole !== 'supervisor') {
    redirect('/queue')
  }

  let sellerStats: Array<{
    id: string
    name: string
    clientCount: number
    remainingCount: number
    contactsWeek: number
    overdueCount: number
    totalSpend: number
    aJourPct: number
    tiers: Record<ClientTier, number>
  }> = []
  let totalClients = 0

  if (isDemoMode) {
    sellerStats = getDemoSellerSummaries()
    totalClients = getDemoClients().length
  } else {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const [{ data: allSellers }, { data: clientsData }, { data: recentContacts }, { data: queueData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('role', 'seller').eq('active', true).order('full_name'),
      supabase.from('clients').select('id, seller_id, tier, total_spend'),
      supabase.from('contacts').select('seller_id').gte('contact_date', weekAgo.toISOString()),
      supabase.from('recontact_queue').select('seller_id, days_overdue'),
    ])

    sellerStats = (allSellers || []).map((seller) => {
      const clients = (clientsData || []).filter((client) => client.seller_id === seller.id)
      const contacts = (recentContacts || []).filter((contact) => contact.seller_id === seller.id).length
      const workloadClients = (queueData || []).filter((client) => client.seller_id === seller.id)
      const overdueClients = workloadClients.filter((client) => (client.days_overdue || 0) > 0)
      const remainingCount = workloadClients.length
      const overdueCount = overdueClients.length
      const totalSpend = clients.reduce((sum, client) => sum + (client.total_spend || 0), 0)
      const aJourPct = clients.length > 0 ? Math.round(((clients.length - overdueCount) / clients.length) * 100) : 100
      const tiers: Record<ClientTier, number> = {
        rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0,
      }
      clients.forEach((client) => {
        if (client.tier && tiers[client.tier as ClientTier] !== undefined) {
          tiers[client.tier as ClientTier]++
        }
      })

      return {
        id: seller.id,
        name: seller.full_name,
        clientCount: clients.length,
        remainingCount,
        contactsWeek: contacts,
        overdueCount,
        totalSpend,
        aJourPct,
        tiers,
      }
    })

    totalClients = clientsData?.length || 0
  }

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="mb-1 font-serif text-4xl text-text">Team</h1>
          <p className="text-text-muted">{sellerStats.length || 0} sellers · {totalClients} clients</p>
        </div>

        {sellerStats.length === 0 ? (
          <div className="border bg-white py-20 text-center" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
            <p className="text-text-muted">No sellers found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sellerStats.map((seller) => (
              <SellerCard key={seller.id} seller={seller} tierOrder={TIER_ORDER} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

