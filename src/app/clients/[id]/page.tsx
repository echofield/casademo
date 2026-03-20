import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import type { Client360, ContactHistoryItem, PurchaseHistoryItem, ClientTier, ContactChannel } from '@/lib/types'
import { getNextMoveContext } from '@/lib/nextMove'
import Link from 'next/link'
import { ClientActions } from './ClientActions'
import { ClientEditControls } from './ClientEditControls'
import { ClientInterestAdd } from './ClientInterestAdd'

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

const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' } as const

export default async function Client360Page({ params }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const supabase = await createClient()

  // Fetch client with seller name
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select(`
      *,
      seller:profiles!clients_seller_id_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  // Fetch interests
  const { data: interests } = await supabase
    .from('client_interests')
    .select('id, category, value, detail')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // Fetch contacts with seller name
  const { data: contacts } = await supabase
    .from('contacts')
    .select(`
      id,
      contact_date,
      channel,
      comment,
      seller:profiles!contacts_seller_id_fkey(full_name)
    `)
    .eq('client_id', id)
    .order('contact_date', { ascending: false })
    .limit(20)

  // Fetch purchases
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, purchase_date, amount, description')
    .eq('client_id', id)
    .order('purchase_date', { ascending: false })
    .limit(20)

  // Build Client360 object
  const clientData: Client360 = {
    id: client.id,
    first_name: client.first_name,
    last_name: client.last_name,
    email: client.email,
    phone: client.phone,
    seller_id: client.seller_id,
    tier: client.tier as ClientTier,
    total_spend: client.total_spend || 0,
    first_contact_date: client.first_contact_date,
    last_contact_date: client.last_contact_date,
    next_recontact_date: client.next_recontact_date,
    notes: client.notes,
    created_at: client.created_at,
    updated_at: client.updated_at,
    seller_name: (() => {
      const s = client.seller as unknown as { full_name: string } | { full_name: string }[] | null
      return Array.isArray(s) ? s[0]?.full_name : s?.full_name
    })() || 'Non assigné',
    interests: interests || [],
    contact_history: (contacts || []).map(c => {
      const sellerData = c.seller as unknown as { full_name: string } | { full_name: string }[] | null
      const sellerName = Array.isArray(sellerData) ? sellerData[0]?.full_name : sellerData?.full_name
      return {
        id: c.id,
        date: c.contact_date,
        channel: c.channel as ContactChannel,
        comment: c.comment,
        seller: sellerName || 'Inconnu',
      }
    }),
    purchase_history: (purchases || []).map(p => ({
      id: p.id,
      date: p.purchase_date,
      amount: p.amount,
      description: p.description,
    })),
  }

  const canEdit = user.profile.role === 'supervisor' || clientData.seller_id === user.id

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
      phone: 'Téléphone',
      email: 'E-mail',
      in_store: 'Boutique',
      other: 'Autre',
    }
    return labels[channel] || channel
  }

  const isPremium = ['grand_prix', 'diplomatico'].includes(clientData.tier)
  const timeline = buildTimeline(clientData)
  const nextMove = getNextMoveContext(clientData)

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-5xl pb-32 md:pb-10">
        <Link
          href="/clients"
          className="label mb-6 inline-flex items-center gap-2 text-text-muted transition-colors duration-200 hover:text-text md:mb-8"
        >
          <span aria-hidden>←</span>
          Clients
        </Link>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          {/* Fiche client */}
          <section
            className="border bg-surface p-6 md:p-8 lg:col-span-2"
            style={cardBorder}
          >
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="label mb-2 text-text-muted">Fiche client</p>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="heading-1 text-text">
                    {clientData.first_name} {clientData.last_name}
                  </h1>
                  <TierBadge tier={clientData.tier} size="md" />
                </div>
                <p className={`font-serif text-3xl ${isPremium ? 'text-gold' : 'text-primary'}`}>
                  {formatCurrency(clientData.total_spend)}
                  <span className="body-small ml-2 font-sans font-normal text-text-muted">
                    total dépensé
                  </span>
                </p>
                <p className="body-small mt-2 text-text-muted">
                  Conseiller : <span className="text-text">{clientData.seller_name}</span>
                </p>
              </div>
              {canEdit && (
                <div className="shrink-0">
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
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t pt-6 body-small" style={cardBorder}>
              {clientData.phone && (
                <a
                  href={`tel:${clientData.phone}`}
                  className="flex w-fit items-center gap-2 text-text hover:text-primary"
                >
                  <span className="label text-text-muted">Tél.</span>
                  {clientData.phone}
                </a>
              )}
              {clientData.email && (
                <a
                  href={`mailto:${clientData.email}`}
                  className="flex w-fit items-center gap-2 text-text hover:text-primary"
                >
                  <span className="label text-text-muted">E-mail</span>
                  {clientData.email}
                </a>
              )}
              {clientData.phone && (
                <a
                  href={`https://wa.me/${clientData.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-fit items-center gap-2 text-primary"
                >
                  <span className="label text-text-muted">WhatsApp</span>
                  Ouvrir la conversation
                </a>
              )}
            </div>

            <div
              className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3"
              style={cardBorder}
            >
              <div>
                <p className="label mb-1 text-text-muted">Premier contact</p>
                <p className="body-small text-text">{formatDate(clientData.first_contact_date)}</p>
              </div>
              <div>
                <p className="label mb-1 text-text-muted">Dernier contact</p>
                <p className="body-small text-text">{formatDate(clientData.last_contact_date)}</p>
              </div>
              <div>
                <p className="label mb-1 text-text-muted">Prochain recontact</p>
                <p className="body-small text-text">{formatDate(clientData.next_recontact_date)}</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-6" style={cardBorder}>
              <p className="label mb-2 text-text-muted">Notes de fiche</p>
              {clientData.notes ? (
                <p className="body whitespace-pre-wrap text-text">{clientData.notes}</p>
              ) : (
                <p className="body-small text-text-muted italic">
                  Aucune note — utilisez « Modifier la fiche » pour en ajouter.
                </p>
              )}
            </div>
          </section>

          {/* Prochaine étape */}
          <section className="border bg-surface p-6" style={cardBorder}>
            <p className="label mb-3 text-text-muted">Prochaine étape</p>
            <h2
              className={`mb-3 font-serif text-xl leading-snug ${
                nextMove.urgent ? 'text-danger' : 'text-text'
              }`}
            >
              {nextMove.headline}
            </h2>
            <p className="body-small mb-6 text-text-muted">{nextMove.detail}</p>
            <p className="label mb-2 text-text-muted">Actions rapides</p>
            <p className="body-small text-text-muted">
              En bas d'écran : enregistrer un contact (met à jour les dates) ou{' '}
              <strong className="font-medium text-text">ajouter un achat</strong> (ex. chemise en soie + montant) pour
              faire évoluer le total et le palier.
            </p>
            <a
              href="#vendor-actions"
              className="label mt-4 inline-block text-primary hover:text-primary-soft"
            >
              Aller aux actions →
            </a>
          </section>
        </div>

        {/* Centres d'intérêt */}
        <section className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
          <p className="label mb-2 text-text-muted">Centres d'intérêt</p>
          <h2 className="mb-4 font-serif text-2xl text-text">Ce qu'il ou elle aime</h2>
          {clientData.interests && clientData.interests.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {clientData.interests.map((interest) => (
                <li
                  key={interest.id}
                  className="border bg-bg-soft px-3 py-2 body-small text-text"
                  style={cardBorder}
                  title={interest.detail || undefined}
                >
                  <span className="text-text-muted">{interest.category}:</span> {interest.value}
                </li>
              ))}
            </ul>
          ) : (
            <p className="body-small text-text-muted">Aucun centre d'intérêt enregistré pour l'instant.</p>
          )}
          <ClientInterestAdd clientId={id} canEdit={canEdit} />
        </section>

        {/* Historique */}
        <section className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
          <p className="label mb-2 text-text-muted">Historique</p>
          <h2 className="mb-6 font-serif text-2xl text-text">Contacts & achats</h2>
          {timeline.length === 0 ? (
            <p className="body-small text-text-muted">
              Rien encore dans l'historique. Utilisez les actions ci-dessous pour enregistrer un contact ou un achat.
            </p>
          ) : (
            <ol className="space-y-0">
              {timeline.map((ev, i) => (
                <li key={`${ev.kind}-${ev.id}`} className="relative flex gap-5 pb-10 last:pb-0">
                  <div className="flex w-4 shrink-0 flex-col items-center">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                        ev.kind === 'purchase' ? 'bg-gold' : 'bg-primary'
                      }`}
                      aria-hidden
                    />
                    {i < timeline.length - 1 && (
                      <span
                        className="mt-2 min-h-[1.5rem] w-px flex-1"
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
                        <p className="body-small mt-2 text-text-muted">Par {ev.data.seller}</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="body font-medium text-text">Achat</p>
                          <p className="body-small text-text-muted">{formatDateShort(ev.data.date)}</p>
                          {ev.data.description && (
                            <p className="body-small mt-1 text-text">{ev.data.description}</p>
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

        <div
          id="vendor-actions"
          className="fixed bottom-0 left-0 right-0 z-30 border-t bg-bg/95 px-4 py-3 backdrop-blur-sm md:static md:z-0 md:mt-8 md:border md:border-t-0 md:bg-surface md:px-6 md:py-4 md:backdrop-blur-none"
          style={cardBorder}
        >
          <p className="label mb-2 text-text-muted md:hidden">Actions vendeur</p>
          <ClientActions clientId={id} />
        </div>
      </div>
    </AppShell>
  )
}
