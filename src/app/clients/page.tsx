import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import { Client, ClientTier, TIER_LABELS, TIER_ORDER } from '@/lib/types'
import Link from 'next/link'
import { ClientListFilters } from './ClientListFilters'

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
  const limit = 20

  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .order('last_contact_date', { ascending: false, nullsFirst: true })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (tier) {
    query = query.eq('tier', tier)
  }

  const { data: clients, count } = await query

  const totalPages = Math.ceil((count || 0) / limit)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="mb-2">Clients</h1>
          <p className="text-ink/60">
            {count} client{count !== 1 ? 's' : ''} total
          </p>
        </header>

        <ClientListFilters
          currentSearch={search}
          currentTier={tier}
          tiers={TIER_ORDER}
          tierLabels={TIER_LABELS}
        />

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-grey-light">
                <th className="small-caps text-left py-3 px-4 font-normal">Name</th>
                <th className="small-caps text-left py-3 px-4 font-normal">Tier</th>
                <th className="small-caps text-left py-3 px-4 font-normal">Total Spend</th>
                <th className="small-caps text-left py-3 px-4 font-normal">Last Contact</th>
                <th className="small-caps text-left py-3 px-4 font-normal">Next Recontact</th>
              </tr>
            </thead>
            <tbody>
              {(clients || []).map((client: Client) => (
                <tr
                  key={client.id}
                  className="border-b border-grey-light/50 hover:bg-white/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <Link href={`/clients/${client.id}`} className="block">
                      <span className="font-serif text-lg hover:text-green transition-colors">
                        {client.first_name} {client.last_name}
                      </span>
                      {client.phone && (
                        <span className="block text-sm text-ink/50 mt-0.5">{client.phone}</span>
                      )}
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <TierBadge tier={client.tier} />
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {formatCurrency(client.total_spend)}
                  </td>
                  <td className="py-4 px-4 text-sm text-ink/60">
                    {formatDate(client.last_contact_date)}
                  </td>
                  <td className="py-4 px-4 text-sm text-ink/60">
                    {formatDate(client.next_recontact_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {(clients || []).map((client: Client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block card"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-serif text-lg">
                  {client.first_name} {client.last_name}
                </h3>
                <TierBadge tier={client.tier} />
              </div>
              <div className="flex items-center gap-4 text-sm text-ink/50">
                <span>{formatCurrency(client.total_spend)}</span>
                <span>Last: {formatDate(client.last_contact_date)}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {(clients || []).length === 0 && (
          <div className="card text-center py-12">
            <p className="text-ink/50 mb-2">No clients found</p>
            {search && <p className="text-sm text-ink/40">Try adjusting your search</p>}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={{ pathname: '/clients', query: { ...params, page: page - 1 } }}
                className="px-4 py-2 text-sm border border-grey-light hover:border-ink/40 transition-colors"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-ink/50">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={{ pathname: '/clients', query: { ...params, page: page + 1 } }}
                className="px-4 py-2 text-sm border border-grey-light hover:border-ink/40 transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
