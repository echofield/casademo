import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, ClientGridCard } from '@/components'
import { ClientTier, TIER_LABELS, TIER_ORDER } from '@/lib/types'
import { ClientListFilters } from './ClientListFilters'
import { AddClientButton } from './AddClientButton'
import Link from 'next/link'

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

  const supabase = await createClient()
  const isSupervisor = user.effectiveRole === 'supervisor'

  // Build clients query - select only needed columns
  let clientsQuery = supabase
    .from('clients')
    .select('id, first_name, last_name, phone, tier, total_spend, last_contact_date, next_recontact_date, seller_id, seller:profiles!clients_seller_id_fkey(full_name)', { count: 'exact' })
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .range((page - 1) * limit, page * limit - 1)

  // Search filter — supports partial, full name ("Kevin Leone"), and reversed name
  if (search) {
    const parts = search.trim().split(/\s+/)
    if (parts.length >= 2) {
      const [a, ...rest] = parts
      const b = rest.join(' ')
      clientsQuery = clientsQuery.or(
        [
          `first_name.ilike.%${search}%`,
          `last_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `phone.ilike.%${search}%`,
          `and(first_name.ilike.%${a}%,last_name.ilike.%${b}%)`,
          `and(first_name.ilike.%${b}%,last_name.ilike.%${a}%)`,
        ].join(',')
      )
    } else {
      clientsQuery = clientsQuery.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      )
    }
  }

  // Tier filter
  if (tier) {
    clientsQuery = clientsQuery.eq('tier', tier)
  }

  // Sellers can only see their own clients
  if (!isSupervisor) {
    clientsQuery = clientsQuery.eq('seller_id', user.id)
  }

  // Run queries in parallel - sellers query only for supervisors
  const [clientsResult, sellersResult] = await Promise.all([
    clientsQuery,
    isSupervisor
      ? supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'seller')
          .eq('active', true)
          .order('full_name')
      : Promise.resolve({ data: [] }),
  ])

  const clients = clientsResult.data
  const count = clientsResult.count
  const sellers = (sellersResult.data || []) as { id: string; full_name: string }[]
  const sellerNameById = new Map(sellers.map((s) => [s.id, s.full_name]))

  const totalPages = Math.ceil((count || 0) / limit)

  // Format helpers
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
    }).replace('.', '')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' €'
  }

  const list = clients || []

  const paginationHref = (p: number) => {
    const sp = new URLSearchParams()
    if (search) sp.set('search', search)
    if (tier) sp.set('tier', tier)
    if (p > 1) sp.set('page', String(p))
    const q = sp.toString()
    return q ? `/clients?${q}` : '/clients'
  }

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-text mb-1">Clients</h1>
          <p className="text-text-muted">{count || 0} in your portfolio</p>
          <div className="mt-4">
            <AddClientButton
              isSupervisor={isSupervisor}
              sellers={sellers}
            />
          </div>
        </div>

        {/* Filters */}
        <ClientListFilters
          currentSearch={search}
          currentTier={tier}
          tiers={TIER_ORDER}
          tierLabels={TIER_LABELS}
        />

        {/* Client grid */}
        {list.length === 0 ? (
          <div
            className="border bg-white py-20 text-center"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <p className="text-text-muted">No clients match your filters.</p>
            {search && <p className="text-sm mt-2 text-text-muted">Try adjusting your search.</p>}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((client) => (
              <ClientGridCard
                key={client.id}
                client={client as any}
                spendLabel={formatCurrency(client.total_spend)}
                lastContactLabel={formatDate(client.last_contact_date)}
                nextRecontactLabel={formatDate(client.next_recontact_date)}
                sellerName={(client as any).seller?.full_name || sellerNameById.get((client as any).seller_id) || null}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav
            className="mt-10 flex items-center justify-center gap-4 border-t pt-8"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
            aria-label="Pagination"
          >
            {page > 1 ? (
              <Link
                href={paginationHref(page - 1)}
                className="text-xs tracking-wider uppercase text-text-muted hover:text-text transition-colors"
              >
                Previous
              </Link>
            ) : (
              <span className="text-xs tracking-wider uppercase text-text-muted/40">Previous</span>
            )}
            <span className="text-sm text-text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={paginationHref(page + 1)}
                className="text-xs tracking-wider uppercase text-text-muted hover:text-text transition-colors"
              >
                Next
              </Link>
            ) : (
              <span className="text-xs tracking-wider uppercase text-text-muted/40">Next</span>
            )}
          </nav>
        )}
      </div>
    </AppShell>
  )
}
