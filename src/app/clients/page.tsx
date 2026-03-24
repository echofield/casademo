import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, PageHeader, ClientGridCard, TierBadge } from '@/components'
import { Client, ClientTier, ClientSignal, TIER_LABELS, TIER_ORDER, InterestItem } from '@/lib/types'
import { ClientListFilters } from './ClientListFilters'
import { AddClientButton } from './AddClientButton'

type SortOption = 'alpha' | 'alpha_desc' | 'spend' | 'spend_desc' | 'last_contact' | 'tier' | 'tier_group'

interface Props {
  searchParams: Promise<{
    search?: string
    tier?: ClientTier
    seller?: string
    sort?: SortOption
    interest?: string
    interest_val?: string
    domain?: string
    locale?: string
    signal?: ClientSignal | 'null'
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
  const interestFilter = params.interest
  const interestValFilter = params.interest_val
  const domainFilter = params.domain
  const localeFilter = params.locale
  const signalFilter = params.signal
  const page = parseInt(params.page || '1', 10)
  const limit = 24

  const supabase = await createClient()
  const isSupervisor = user.profile.role === 'supervisor'

  // Fetch sellers for filter (supervisors only)
  let sellers: { id: string; full_name: string }[] = []
  if (isSupervisor) {
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

  const sellerMap = new Map(sellers.map(s => [s.id, s.full_name]))

  // Fetch interest taxonomy for the grouped dropdown (with domain)
  const { data: interestTaxonomy } = await supabase
    .from('interest_taxonomy')
    .select('category, value, display_label, domain')
    .order('category')
    .order('sort_order')

  const interestValues = (interestTaxonomy || []).map(t => ({
    category: t.category,
    value: t.value,
    displayLabel: t.display_label,
    domain: (t.domain || 'fashion') as string,
  }))

  // Legacy: get distinct interest categories
  const { data: interestCategories } = await supabase
    .from('client_interests')
    .select('category')
    .order('category')

  const uniqueInterests = Array.from(new Set((interestCategories || []).map(i => i.category))).filter(Boolean)

  // If interest filter is active (either category or value), get matching client IDs
  let interestClientIds: string[] | null = null
  if (interestValFilter) {
    let interestQuery = supabase
      .from('client_interests')
      .select('client_id')
      .eq('value', interestValFilter)
    if (domainFilter) interestQuery = interestQuery.eq('domain', domainFilter)
    const { data: matchingInterests } = await interestQuery
    interestClientIds = matchingInterests?.map(i => i.client_id) || []
  } else if (interestFilter) {
    const { data: matchingInterests } = await supabase
      .from('client_interests')
      .select('client_id')
      .eq('category', interestFilter)
    interestClientIds = matchingInterests?.map(i => i.client_id) || []
  }

  const sort = params.sort || 'alpha'

  // Demo mode: only show demo clients
  const DEMO_MODE = false

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('is_demo', DEMO_MODE)

  const isTierGroup = sort === 'tier_group'

  // Apply sorting
  switch (sort) {
    case 'alpha':
      query = query.order('last_name', { ascending: true }).order('first_name', { ascending: true })
      break
    case 'alpha_desc':
      query = query.order('last_name', { ascending: false }).order('first_name', { ascending: false })
      break
    case 'spend':
      query = query.order('total_spend', { ascending: true })
      break
    case 'spend_desc':
      query = query.order('total_spend', { ascending: false })
      break
    case 'last_contact':
      query = query.order('last_contact_date', { ascending: false, nullsFirst: true })
      break
    case 'tier':
    case 'tier_group':
      query = query.order('total_spend', { ascending: false })
      break
    default:
      query = query.order('last_name', { ascending: true })
  }

  if (!isTierGroup) {
    query = query.range((page - 1) * limit, page * limit - 1)
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  if (tier) {
    query = query.eq('tier', tier)
  }

  // Signal filter
  if (signalFilter) {
    if (signalFilter === 'null') {
      query = query.is('seller_signal', null)
    } else {
      query = query.eq('seller_signal', signalFilter)
    }
  }

  // Locale filter
  if (localeFilter) {
    query = query.eq('locale', localeFilter)
  }

  // Sellers can only see their own clients
  if (!isSupervisor) {
    query = query.eq('seller_id', user.id)
  } else if (sellerId) {
    query = query.eq('seller_id', sellerId)
  }

  if (interestClientIds !== null) {
    if (interestClientIds.length > 0) {
      query = query.in('id', interestClientIds)
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000')
    }
  }

  const { data: clients, count } = await query

  // Fetch interests for the clients to display on cards
  const clientIds = (clients || []).map(c => c.id)
  let clientInterestsMap = new Map<string, InterestItem[]>()

  if (clientIds.length > 0) {
    const { data: allInterests } = await supabase
      .from('client_interests')
      .select('id, client_id, category, value, detail, domain')
      .in('client_id', clientIds)

    // Group by client_id — only fashion interests on cards
    ;(allInterests || []).forEach((interest) => {
      if (interest.domain === 'life') return
      const existing = clientInterestsMap.get(interest.client_id) || []
      existing.push({
        id: interest.id,
        category: interest.category,
        value: interest.value,
        detail: interest.detail,
        domain: (interest.domain || 'fashion') as 'fashion' | 'life',
      })
      clientInterestsMap.set(interest.client_id, existing)
    })
  }

  // Fetch last purchase per client
  let lastPurchaseMap = new Map<string, { product_name: string | null; purchase_date: string; size: string | null; is_gift: boolean }>()

  if (clientIds.length > 0) {
    const { data: purchases } = await supabase
      .from('purchases')
      .select('client_id, product_name, purchase_date, size, is_gift')
      .in('client_id', clientIds)
      .order('purchase_date', { ascending: false })

    if (purchases) {
      for (const p of purchases) {
        if (!lastPurchaseMap.has(p.client_id)) {
          lastPurchaseMap.set(p.client_id, {
            product_name: p.product_name,
            purchase_date: p.purchase_date,
            size: p.size,
            is_gift: p.is_gift ?? false,
          })
        }
      }
    }
  }

  const totalPages = isTierGroup ? 1 : Math.ceil((count || 0) / limit)

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

  const list = (clients || []) as (Client & { seller_signal?: ClientSignal | null })[]

  const paginationHref = (p: number) => {
    const sp = new URLSearchParams()
    if (search) sp.set('search', search)
    if (tier) sp.set('tier', tier)
    if (sellerId) sp.set('seller', sellerId)
    if (interestValFilter) sp.set('interest_val', interestValFilter)
    else if (interestFilter) sp.set('interest', interestFilter)
    if (domainFilter) sp.set('domain', domainFilter)
    if (localeFilter) sp.set('locale', localeFilter)
    if (signalFilter) sp.set('signal', signalFilter)
    if (sort && sort !== 'alpha') sp.set('sort', sort)
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
          currentSort={sort}
          currentInterest={interestFilter}
          currentInterestVal={interestValFilter}
          currentSignal={signalFilter}
          currentLocale={localeFilter}
          tiers={TIER_ORDER}
          tierLabels={TIER_LABELS}
          sellers={sellers}
          interests={uniqueInterests}
          interestValues={interestValues}
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
        ) : isTierGroup ? (
          /* Tier-grouped view */
          <div className="space-y-10">
            {[...TIER_ORDER].reverse().map((tierKey) => {
              const tierClients = list.filter(c => c.tier === tierKey)
              if (tierClients.length === 0) return null
              const tierSpend = tierClients.reduce((sum, c) => sum + c.total_spend, 0)
              return (
                <section key={tierKey}>
                  <div className="mb-4 flex items-center gap-4 border-b pb-3" style={{ borderColor: 'rgba(28, 27, 25, 0.1)' }}>
                    <TierBadge tier={tierKey} />
                    <span className="text-text-muted text-sm">
                      {tierClients.length} client{tierClients.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-text-muted text-sm ml-auto">
                      {formatCurrency(tierSpend)} total
                    </span>
                  </div>
                  <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {tierClients.map((client) => (
                      <li key={client.id}>
                        <ClientGridCard
                          client={{
                            ...client,
                            seller_signal: client.seller_signal ?? null,
                            interests: clientInterestsMap.get(client.id) || null,
                          }}
                          spendLabel={formatCurrency(client.total_spend)}
                          lastContactLabel={formatDate(client.last_contact_date)}
                          nextRecontactLabel={formatDate(client.next_recontact_date)}
                          sellerName={isSupervisor ? sellerMap.get(client.seller_id) : undefined}
                          lastPurchase={lastPurchaseMap.get(client.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        ) : (
          /* Flat grid view */
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((client) => (
              <li key={client.id}>
                <ClientGridCard
                  client={{
                    ...client,
                    seller_signal: client.seller_signal ?? null,
                    interests: clientInterestsMap.get(client.id) || null,
                  }}
                  spendLabel={formatCurrency(client.total_spend)}
                  lastContactLabel={formatDate(client.last_contact_date)}
                  nextRecontactLabel={formatDate(client.next_recontact_date)}
                  sellerName={isSupervisor ? sellerMap.get(client.seller_id) : undefined}
                  lastPurchase={lastPurchaseMap.get(client.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {!isTierGroup && totalPages > 1 && (
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
