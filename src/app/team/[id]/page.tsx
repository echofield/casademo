import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AppShell, QueueStack } from '@/components'
import type { InterestItem, ClientSignal } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SellerDetailPage({ params }: PageProps) {
  const { id: sellerId } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.effectiveRole !== 'supervisor') {
    redirect('/queue')
  }

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Fetch the seller profile
  const { data: seller } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', sellerId)
    .single()

  if (!seller) {
    redirect('/team')
  }

  // Fetch seller's live workload, total portfolio, and recent contact activity
  const [{ data: queue }, { data: weekContacts }, { count: portfolioCount }] = await Promise.all([
    supabase
      .from('recontact_queue')
      .select('*')
      .eq('seller_id', sellerId)
      .limit(100),
    supabase
      .from('contacts')
      .select('id, contact_date, channel, client:clients(first_name, last_name)')
      .eq('seller_id', sellerId)
      .gte('contact_date', weekAgo.toISOString())
      .order('contact_date', { ascending: false })
      .limit(50),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', sellerId),
  ])

  const items = queue || []

  // Fetch interests for queue clients
  const clientIds = items.map(i => i.id)
  const clientInterestsMap = new Map<string, InterestItem[]>()

  if (clientIds.length > 0) {
    const { data: allInterests } = await supabase
      .from('client_interests')
      .select('id, client_id, category, value, detail, domain')
      .in('client_id', clientIds)
      .eq('is_deleted', false)

    ;(allInterests || []).forEach((interest) => {
      const existing = clientInterestsMap.get(interest.client_id) || []
      existing.push({
        id: interest.id,
        category: interest.category,
        value: interest.value,
        detail: interest.detail,
        domain: (interest.domain || 'product') as 'product' | 'life',
      })
      clientInterestsMap.set(interest.client_id, existing)
    })
  }

  // Format dates server-side
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    })
  }

  const clientsWithLabels = items.map(item => ({
    id: item.id,
    first_name: item.first_name,
    last_name: item.last_name,
    tier: item.tier,
    phone: item.phone,
    total_spend: item.total_spend,
    days_overdue: item.days_overdue,
    seller_id: item.seller_id,
    seller_name: item.seller_name,
    lastContactLabel: formatDate(item.last_contact_date),
    nextContactLabel: formatDate(item.next_recontact_date),
    seller_signal: (item as any).seller_signal ?? null,
    signal_note: (item as any).signal_note ?? null,
    interests: clientInterestsMap.get(item.id) || null,
    locale: (item as any).locale || 'local',
  }))

  const overdueCount = items.filter(i => (i.days_overdue ?? 0) > 0).length
  const totalSpend = items.reduce((sum, c) => sum + (c.total_spend || 0), 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' EUR'
  }

  const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' }
  const channelLabel = (value: string) => value.replace('_', ' ')

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/team"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to team
        </Link>

        {/* Seller header */}
        <div className="border bg-surface p-6 mb-8" style={cardBorder}>
          <h1 className="font-serif text-3xl text-text mb-2">{seller.full_name}</h1>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-text-muted">Remaining</span>
              <span className="ml-2 text-text font-medium">{items.length}</span>
            </div>
            <div>
              <span className="text-text-muted">Portfolio</span>
              <span className="ml-2 text-text font-medium">{portfolioCount || 0}</span>
            </div>
            <div>
              <span className="text-text-muted">Value</span>
              <span className="ml-2 text-text font-medium">{formatCurrency(totalSpend)}</span>
            </div>
            {overdueCount > 0 && (
              <div>
                <span className="text-danger font-medium">{overdueCount} overdue</span>
              </div>
            )}
          </div>
        </div>

        {/* Client queue for this seller */}
        {clientsWithLabels.length === 0 ? (
          <div className="py-16 text-center border bg-surface" style={cardBorder}>
            <p className="font-serif text-xl text-text mb-2">No clients</p>
            <p className="text-text-muted text-sm">This seller has no assigned clients.</p>
          </div>
        ) : (
          <QueueStack
            clients={clientsWithLabels}
            overdueCount={overdueCount}
            totalCount={items.length}
            userRole={user.profile.role}
            currentUserId={user.id}
            remainingWorkloadCount={items.length}
          />
        )}

        <div id="contacts-week" className="mt-8 border bg-surface p-6" style={cardBorder}>
          <h2 className="font-serif text-xl text-text mb-2">Contacts this week</h2>
          {!(weekContacts && weekContacts.length > 0) ? (
            <p className="text-sm text-text-muted">No contacts logged in the last 7 days.</p>
          ) : (
            <div className="space-y-2">
              {weekContacts.map((contact) => {
                const client = (Array.isArray(contact.client) ? contact.client[0] : contact.client) as { id?: string; first_name?: string; last_name?: string } | null
                const fullName = [client?.first_name, client?.last_name].filter(Boolean).join(' ') || 'Client'
                return (
                  <div key={contact.id} className="text-sm text-text-muted">
                    <Link href={client?.id ? `/clients/${client.id}` : '/clients'} className="hover:text-text transition-colors">
                      {fullName}
                    </Link>
                    {' · '}
                    {new Date(contact.contact_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' · '}
                    {channelLabel(contact.channel)}
                    {' · '}
                    {seller.full_name}
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
