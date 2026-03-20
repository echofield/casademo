import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import type { Client360, ContactHistoryItem, PurchaseHistoryItem } from '@/lib/types'
import Link from 'next/link'
import { ClientActions } from './ClientActions'
import { ClientEditControls } from './ClientEditControls'

interface Props {
  params: Promise<{ id: string }>
}

type TimelineEvent =
  | { kind: 'contact'; id: string; at: number; data: ContactHistoryItem }
  | { kind: 'purchase'; id: string; at: number; data: PurchaseHistoryItem }

function buildTimeline(clientData: Client360): TimelineEvent[] {
  const contacts = (clientData.contact_history || []).map((c) => ({
    kind: 'contact' as const,
    id: c.id,
    at: new Date(c.date).getTime(),
    data: c,
  }))
  const purchases = (clientData.purchase_history || []).map((p) => ({
    kind: 'purchase' as const,
    id: p.id,
    at: new Date(p.date).getTime(),
    data: p,
  }))
  return [...contacts, ...purchases].sort((a, b) => b.at - a.at)
}

export default async function Client360Page({ params }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const supabase = await createClient()

  const { data: client, error } = await supabase.rpc('get_client_360', { client_id: id }).single()

  if (error || !client) {
    notFound()
  }

  const clientData = client as Client360

  let sellerOptions: { id: string; full_name: string }[] | undefined
  if (user.profile.role === 'supervisor') {
    const { data: sellers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'seller')
      .eq('active', true)
      .order('full_name')
    sellerOptions = sellers || []
  }

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatChannel = (channel: string) => {
    const labels: Record<string, string> = {
      whatsapp: 'WhatsApp',
      sms: 'SMS',
      phone: 'Phone',
      email: 'Email',
      in_store: 'In Store',
      other: 'Other',
    }
    return labels[channel] || channel
  }

  const isPremium = ['grand_prix', 'diplomatico'].includes(clientData.tier)
  const timeline = buildTimeline(clientData)

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-4xl pb-28 md:pb-0">
        <Link
          href="/clients"
          className="label mb-8 inline-flex items-center gap-2 text-text-muted transition-colors duration-200 hover:text-text"
        >
          <span aria-hidden>←</span>
          Clients
        </Link>

        {/* Hero */}
        <header
          className="mb-8 border bg-surface p-6 md:p-8"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="label mb-3 text-text-muted">Client</p>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h1 className="heading-1 text-text">
                  {clientData.first_name} {clientData.last_name}
                </h1>
                <TierBadge tier={clientData.tier} size="md" />
              </div>
              <p className={`font-serif text-3xl ${isPremium ? 'text-gold' : 'text-primary'}`}>
                {formatCurrency(clientData.total_spend)}
              </p>
              <p className="body-small mt-3 text-text-muted">
                Managed by <span className="text-text">{clientData.seller_name}</span>
              </p>
            </div>

            <div className="flex min-w-[200px] flex-col gap-2 body-small">
              {clientData.phone && (
                <a
                  href={`tel:${clientData.phone}`}
                  className="flex items-center gap-2 text-text transition-colors duration-200 hover:text-primary"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {clientData.phone}
                </a>
              )}
              {clientData.email && (
                <a
                  href={`mailto:${clientData.email}`}
                  className="flex items-center gap-2 text-text transition-colors duration-200 hover:text-primary"
                >
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {clientData.email}
                </a>
              )}
              {clientData.phone && (
                <a
                  href={`https://wa.me/${clientData.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary transition-opacity duration-200 hover:opacity-85"
                >
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div
            className="mt-8 grid grid-cols-1 gap-6 border-t pt-8 sm:grid-cols-3"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <div>
              <p className="label mb-1 text-text-muted">First contact</p>
              <p className="body-small text-text">{formatDate(clientData.first_contact_date)}</p>
            </div>
            <div>
              <p className="label mb-1 text-text-muted">Last contact</p>
              <p className="body-small text-text">{formatDate(clientData.last_contact_date)}</p>
            </div>
            <div>
              <p className="label mb-1 text-text-muted">Next recontact</p>
              <p className="body-small text-text">{formatDate(clientData.next_recontact_date)}</p>
            </div>
          </div>
        </header>

        <ClientEditControls
          clientId={id}
          currentUserId={user.id}
          userRole={user.profile.role}
          sellerId={clientData.seller_id}
          sellerName={clientData.seller_name}
          initial={{
            first_name: clientData.first_name,
            last_name: clientData.last_name,
            email: clientData.email,
            phone: clientData.phone,
            notes: clientData.notes,
          }}
          sellerOptions={sellerOptions}
        />

        <div
          className="fixed bottom-0 left-0 right-0 z-30 border-t bg-bg/95 px-4 py-3 backdrop-blur-sm md:static md:z-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <ClientActions clientId={id} />
        </div>

        {clientData.notes && (
          <section
            className="mb-8 border bg-surface p-6"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <h2 className="label mb-4 text-text-muted">Notes</h2>
            <p className="body whitespace-pre-wrap text-text">{clientData.notes}</p>
          </section>
        )}

        <section
          className="mb-8 border bg-surface p-6"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <h2 className="label mb-4 text-text-muted">Interests</h2>
          {clientData.interests && clientData.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {clientData.interests.map((interest) => (
                <span
                  key={interest.id}
                  className="border bg-bg-soft px-3 py-1.5 body-small text-text"
                  style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
                  title={interest.detail || undefined}
                >
                  <span className="text-text-muted">{interest.category}:</span> {interest.value}
                </span>
              ))}
            </div>
          ) : (
            <p className="body-small text-text-muted">No interests recorded yet.</p>
          )}
        </section>

        <section
          className="border bg-surface p-6 md:p-8"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <h2 className="label mb-8 text-text-muted">Activity</h2>
          {timeline.length === 0 ? (
            <p className="body-small text-text-muted">No contacts or purchases yet.</p>
          ) : (
            <ol className="space-y-0">
              {timeline.map((ev, i) => (
                <li
                  key={`${ev.kind}-${ev.id}`}
                  className="relative flex gap-5 pb-10 last:pb-0"
                >
                  <div className="flex w-4 shrink-0 flex-col items-center">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    {i < timeline.length - 1 && (
                      <span
                        className="mt-2 w-px flex-1 min-h-[1.5rem]"
                        style={{ backgroundColor: 'rgba(28, 27, 25, 0.12)' }}
                        aria-hidden
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                  {ev.kind === 'contact' ? (
                    <div>
                      <div className="mb-1 flex flex-wrap items-baseline gap-2">
                        <span className="body font-medium text-text">{formatChannel(ev.data.channel)}</span>
                        <span className="body-small text-text-muted">{formatDateShort(ev.data.date)}</span>
                      </div>
                      {ev.data.comment && <p className="body-small text-text">{ev.data.comment}</p>}
                      <p className="body-small mt-2 text-text-muted">by {ev.data.seller}</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <p className="body font-medium text-text">Purchase</p>
                        <p className="body-small text-text-muted">{formatDateShort(ev.data.date)}</p>
                        {ev.data.description && (
                          <p className="body-small mt-1 text-text-muted">{ev.data.description}</p>
                        )}
                      </div>
                      <p className={`font-serif text-lg ${isPremium ? 'text-gold' : 'text-primary'}`}>
                        {formatCurrency(ev.data.amount)}
                      </p>
                    </div>
                  )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </AppShell>
  )
}
