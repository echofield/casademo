import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge, PageHeader } from '@/components'
import { Client, ClientTier, TIER_LABELS, TIER_ORDER } from '@/lib/types'
import Link from 'next/link'
import { ClientListFilters } from './ClientListFilters'
import { AddClientButton } from './AddClientButton'

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

  let sellersForAdd: { id: string; full_name: string }[] = []
  if (user.profile.role === 'supervisor') {
    const { data: s } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'seller')
      .eq('active', true)
      .order('full_name')
    sellersForAdd = s || []
  }

  const totalPages = Math.ceil((count || 0) / limit)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
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

  const isHighValue = (clientTier: string) => ['grand_prix', 'diplomatico'].includes(clientTier)

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-6xl mx-auto animate-fade-in">
        <PageHeader
          title="Clients"
          subtitle={`${count || 0} client${(count || 0) !== 1 ? 's' : ''} total`}
          actions={
            <AddClientButton
              isSupervisor={user.profile.role === 'supervisor'}
              sellers={sellersForAdd}
            />
          }
        />

        <ClientListFilters
          currentSearch={search}
          currentTier={tier}
          tiers={TIER_ORDER}
          tierLabels={TIER_LABELS}
        />

        {/* Desktop Table */}
        <div
          className="hidden md:block bg-surface overflow-hidden"
          style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.08)' }}>
                <th className="label text-left py-4 px-5 font-semibold text-text-muted">Name</th>
                <th className="label text-left py-4 px-5 font-semibold text-text-muted">Tier</th>
                <th className="label text-right py-4 px-5 font-semibold text-text-muted">Total Spend</th>
                <th className="label text-left py-4 px-5 font-semibold text-text-muted">Last Contact</th>
                <th className="label text-left py-4 px-5 font-semibold text-text-muted">Next Recontact</th>
              </tr>
            </thead>
            <tbody>
              {(clients || []).map((client: Client) => (
                <tr
                  key={client.id}
                  className="hover:bg-bg-soft transition-colors duration-200 cursor-pointer"
                  style={{ borderBottom: '1px solid rgba(28, 27, 25, 0.05)' }}
                >
                  <td className="py-5 px-5">
                    <Link href={`/clients/${client.id}`} className="block">
                      <span className="table-value text-text hover:text-primary transition-colors">
                        {client.first_name} {client.last_name}
                      </span>
                      {client.phone && (
                        <span className="block text-sm text-text-muted mt-0.5">{client.phone}</span>
                      )}
                    </Link>
                  </td>
                  <td className="py-5 px-5">
                    <TierBadge tier={client.tier} />
                  </td>
                  <td className={`py-5 px-5 text-right table-value ${isHighValue(client.tier) ? 'text-gold' : 'text-text'}`}>
                    {formatCurrency(client.total_spend)}
                  </td>
                  <td className="py-5 px-5 text-sm text-text-muted">
                    {formatDate(client.last_contact_date)}
                  </td>
                  <td className="py-5 px-5 text-sm text-text-muted">
                    {formatDate(client.next_recontact_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-2">
          {(clients || []).map((client: Client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block bg-surface p-4 hover:bg-bg-soft transition-colors duration-200"
              style={{ border: '1px solid rgba(28, 27, 25, 0.08)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="table-value text-text">
                  {client.first_name} {client.last_name}
                </span>
                <TierBadge tier={client.tier} />
              </div>
              <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className={isHighValue(client.tier) ? 'text-gold' : ''}>
                  {formatCurrency(client.total_spend)}
                </span>
                <span>Last: {formatDate(client.last_contact_date)}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {(clients || []).length === 0 && (
          <div className="py-16 text-center">
            <p className="text-text-muted mb-2">No clients found</p>
            {search && <p className="text-sm text-text-muted">Try adjusting your search</p>}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            {page > 1 && (
              <Link
                href={{ pathname: '/clients', query: { ...params, page: page - 1 } }}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
                style={{ border: '1px solid rgba(28, 27, 25, 0.1)' }}
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-text-muted">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={{ pathname: '/clients', query: { ...params, page: page + 1 } }}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
                style={{ border: '1px solid rgba(28, 27, 25, 0.1)' }}
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
