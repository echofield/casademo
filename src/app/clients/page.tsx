import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, ClientGridCard } from '@/components'
import { ClientTier, TIER_LABELS, TIER_ORDER } from '@/lib/types'
import { ClientListFilters } from './ClientListFilters'
import { AddClientButton } from './AddClientButton'
import Link from 'next/link'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoClients, getDemoSellerRoster } from '@/lib/demo/presentation-data'

interface Props {
  searchParams: Promise<{
    search?: string
    tier?: ClientTier
    page?: string
  }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const search = params.search || ''
  const tier = params.tier
  const page = parseInt(params.page || '1', 10)
  const limit = 24
  const isSupervisor = user.effectiveRole === 'supervisor'

  let clients: Array<{
    id: string
    first_name: string
    last_name: string
    phone: string | null
    tier: ClientTier
    total_spend: number
    last_contact_date: string | null
    next_recontact_date: string | null
    seller_id: string
    seller?: { full_name: string } | { full_name: string }[] | null
  }> = []
  let count = 0
  let sellers: Array<{ id: string; full_name: string }> = []

  if (isDemoMode) {
    const roster = getDemoSellerRoster()
      .filter((seller) => seller.active)
      .map((seller) => ({ id: seller.id, full_name: seller.full_name }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name))

    const query = search.trim().toLowerCase()
    const filtered = getDemoClients()
      .filter((client) => (isSupervisor ? true : client.seller_id === user.id))
      .filter((client) => (tier ? client.tier === tier : true))
      .filter((client) => {
        if (!query) return true
        const haystack = [
          client.first_name,
          client.last_name,
          `${client.first_name} ${client.last_name}`,
          `${client.last_name} ${client.first_name}`,
          client.email || '',
          client.phone || '',
        ].join(' ').toLowerCase()
        return haystack.includes(query)
      })
      .sort((a, b) => {
        const lastName = a.last_name.localeCompare(b.last_name)
        return lastName !== 0 ? lastName : a.first_name.localeCompare(b.first_name)
      })

    count = filtered.length
    clients = filtered.slice((page - 1) * limit, page * limit).map((client) => ({
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone,
      tier: client.tier,
      total_spend: client.total_spend,
      last_contact_date: client.last_contact_date,
      next_recontact_date: client.next_recontact_date,
      seller_id: client.seller_id,
      seller: { full_name: client.seller_name },
    }))
    sellers = roster
  } else {
    const supabase = await createClient()

    let clientsQuery = supabase
      .from('clients')
      .select('id, first_name, last_name, phone, tier, total_spend, last_contact_date, next_recontact_date, seller_id, seller:profiles!clients_seller_id_fkey(full_name)', { count: 'exact' })
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)

    if (search) {
      const parts = search.trim().split(/\s+/)
      if (parts.length >= 2) {
        const [a, ...rest] = parts
        const b = rest.join(' ')
        clientsQuery = clientsQuery.or([
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `and(first_name.ilike.%${a}%,last_name.ilike.%${b}%)`,
          `and(first_name.ilike.%${b}%,last_name.ilike.%${a}%)`,
        ].join(','))
      } else {
        clientsQuery = clientsQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
      }
    }

    if (tier) {
      clientsQuery = clientsQuery.eq('tier', tier)
    }

    if (!isSupervisor) {
      clientsQuery = clientsQuery.eq('seller_id', user.id)
    }

    const [clientsResult, sellersResult] = await Promise.all([
      clientsQuery,
      isSupervisor
        ? supabase
            .from('profiles')
            .select('id, full_name')
            .in('role', ['seller', 'supervisor'])
            .eq('active', true)
            .order('full_name')
        : Promise.resolve({ data: [] }),
    ])

    clients = (clientsResult.data || []) as typeof clients
    count = clientsResult.count || 0
    sellers = (sellersResult.data || []) as { id: string; full_name: string }[]
  }

  const sellerNameById = new Map(sellers.map((seller) => [seller.id, seller.full_name]))
  const totalPages = Math.ceil((count || 0) / limit)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).replace('.', '')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' EUR'
  }

  const paginationHref = (nextPage: number) => {
    const sp = new URLSearchParams()
    if (search) sp.set('search', search)
    if (tier) sp.set('tier', tier)
    if (nextPage > 1) sp.set('page', String(nextPage))
    const q = sp.toString()
    return q ? `/clients?${q}` : '/clients'
  }

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="mb-8">
          <h1 className="mb-1 font-serif text-4xl text-text">Clients</h1>
          <p className="text-text-muted">{count || 0} in your portfolio{isDemoMode ? ' · seeded presentation set' : ''}</p>
          <div className="mt-4">
            <AddClientButton isSupervisor={isSupervisor} sellers={sellers} />
          </div>
        </div>

        <ClientListFilters currentSearch={search} currentTier={tier} tiers={TIER_ORDER} tierLabels={TIER_LABELS} />

        {clients.length === 0 ? (
          <div className="border bg-white py-20 text-center" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
            <p className="text-text-muted">No clients match your filters.</p>
            {search && <p className="mt-2 text-sm text-text-muted">Try adjusting your search.</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <ClientGridCard
                key={client.id}
                client={client}
                spendLabel={formatCurrency(client.total_spend)}
                lastContactLabel={formatDate(client.last_contact_date)}
                nextRecontactLabel={formatDate(client.next_recontact_date)}
                sellerName={(Array.isArray(client.seller) ? client.seller[0]?.full_name : client.seller?.full_name) || sellerNameById.get(client.seller_id) || null}
              />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-4 border-t pt-8" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }} aria-label="Pagination">
            {page > 1 ? (
              <Link href={paginationHref(page - 1)} className="text-xs uppercase tracking-wider text-text-muted transition-colors hover:text-text">Previous</Link>
            ) : (
              <span className="text-xs uppercase tracking-wider text-text-muted/40">Previous</span>
            )}
            <span className="text-sm text-text-muted">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <Link href={paginationHref(page + 1)} className="text-xs uppercase tracking-wider text-text-muted transition-colors hover:text-text">Next</Link>
            ) : (
              <span className="text-xs uppercase tracking-wider text-text-muted/40">Next</span>
            )}
          </nav>
        )}
      </div>
    </AppShell>
  )
}




