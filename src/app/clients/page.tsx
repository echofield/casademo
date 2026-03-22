import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, PageHeader, ClientGridCard } from '@/components'
import { Client, ClientTier, TIER_LABELS, TIER_ORDER } from '@/lib/types'
import { ClientListFilters } from './ClientListFilters'
import { AddClientButton } from './AddClientButton'

interface Props {
  searchParams: Promise<{
    search?: string
    tier?: ClientTier
    seller?: string
    page?: string
  }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const search = params.search || ''
  const tier = params.tier
  const sellerId = params.seller
  const page = parseInt(params.page || '1', 10)
  const limit = 24

  const supabase = await createClient()
  const isSupervisor = user.profile.role === 'supervisor'

  // Fetch sellers for filter (supervisors only)
  let sellers: { id: string; full_name: string }[] = []
  if (isSupervisor) {
    // Get all profiles that have seller role (via profiles_roles table)
    const { data: sellerRoles } = await supabase
      .from('profiles_roles')
      .select('user_id')
      .eq('role', 'seller')

    const sellerIds = sellerRoles?.map(r => r.user_id) || []

    if (sellerIds.length > 0) {
      const { data: s } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', sellerIds)
        .eq('active', true)
        .order('full_name')
      sellers = s || []
    }
  }

  // Build seller lookup map
  const sellerMap = new Map(sellers.map(s => [s.id, s.full_name]))

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('last_contact_date', { ascending: false, nullsFirst: true })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  if (tier) {
    query = query.eq('tier', tier)
  }

  if (sellerId && isSupervisor) {
    query = query.eq('seller_id', sellerId)
  }

  const { data: clients, count } = await query

  const totalPages = Math.ceil((count || 0) / limit)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const list = (clients || []) as Client[]

  const paginationHref = (p: number) => {
    const sp = new URLSearchParams()
    if (search) sp.set('search', search)
    if (tier) sp.set('tier', tier)
    if (sellerId) sp.set('seller', sellerId)
    if (p > 1) sp.set('page', String(p))
    const q = sp.toString()
    return q ? `/clients?${q}` : '/clients'
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl animate-fade-in">
        <PageHeader
          title="Clients"
          subtitle={`${count || 0} in your portfolio`}
          actions={
            <AddClientButton
              isSupervisor={isSupervisor}
              sellers={sellers}
            />
          }
        />

        <ClientListFilters
          currentSearch={search}
          currentTier={tier}
          currentSeller={sellerId}
          tiers={TIER_ORDER}
          tierLabels={TIER_LABELS}
          sellers={sellers}
          isSupervisor={isSupervisor}
        />

        {list.length === 0 ? (
          <div
            className="border bg-surface py-20 text-center"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <p className="body text-text-muted">No clients match your filters.</p>
            {search && <p className="body-small mt-2 text-text-muted">Try adjusting search or tier.</p>}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((client) => (
              <li key={client.id}>
                <ClientGridCard
                  client={client}
                  spendLabel={formatCurrency(client.total_spend)}
                  lastContactLabel={formatDate(client.last_contact_date)}
                  nextRecontactLabel={formatDate(client.next_recontact_date)}
                  sellerName={isSupervisor ? sellerMap.get(client.seller_id) : undefined}
                />
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-4 border-t pt-8"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
            aria-label="Pagination"
          >
            {page > 1 ? (
              <a
                href={paginationHref(page - 1)}
                className="label text-text-muted transition-colors duration-200 hover:text-text"
              >
                Previous
              </a>
            ) : (
              <span className="label text-text-muted/40">Previous</span>
            )}
            <span className="body-small text-text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <a
                href={paginationHref(page + 1)}
                className="label text-text-muted transition-colors duration-200 hover:text-text"
              >
                Next
              </a>
            ) : (
              <span className="label text-text-muted/40">Next</span>
            )}
          </nav>
        )}
      </div>
    </AppShell>
  )
}
