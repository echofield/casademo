import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { AppShell, TierBadge, OriginBadge, PersonalShopperBadge, HeatIndicator, InterestTag } from '@/components'
import type { Client360, ContactHistoryItem, PurchaseHistoryItem, ClientTier, ContactChannel, ClientOrigin, ClientSignal, KnownSizeItem, ClientLocale, FirstImpact } from '@/lib/types'
import { FIRST_IMPACT_CONFIG, LOCALE_LABELS } from '@/lib/types'
import { ClientLifeNotes } from './ClientLifeNotes'
import { getNextMoveContext } from '@/lib/nextMove'
import Link from 'next/link'
import { ClientActions } from './ClientActions'
import { ClientEditControls } from './ClientEditControls'
import { ClientInterestAdd } from './ClientInterestAdd'
import { NotifySellerButton } from './NotifySellerButton'
import { ClientMeetingsSection } from './ClientMeetingsSection'
import { ClientSignalSection } from './ClientSignalSection'

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

  // Fetch interests (with domain)
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

  // Fetch purchases (with product details)
  const { data: purchases } = await supabase
    .from('purchases')
    .select('id, purchase_date, amount, description')
    .eq('client_id', id)
    .order('purchase_date', { ascending: false })
    .limit(20)

  // Fetch derived sizes from purchase history
  const { data: knownSizes } = await supabase
    .from('client_known_sizes' as any)
    .select('*')
    .eq('client_id', id)

  // Fetch sizing
  const { data: sizing } = await supabase
    .from('client_sizing')
    .select('id, category, size, fit_preference, notes')
    .eq('client_id', id)
    .order('category')

  // Fetch visits
  const { data: visits } = await supabase
    .from('visits')
    .select('id, visit_date, duration_minutes, tried_products, notes, converted')
    .eq('client_id', id)
    .order('visit_date', { ascending: false })
    .limit(20)

  // Fetch interest counts for the seller's portfolio (A.3)
  // First get all client IDs for this seller
  const { data: sellerClientIds } = await supabase
    .from('clients')
    .select('id')
    .eq('seller_id', client.seller_id)

  const clientIdList = (sellerClientIds || []).map(c => c.id)

  const { data: interestCounts } = clientIdList.length > 0
    ? await supabase
        .from('client_interests')
        .select('value')
        .in('client_id', clientIdList)
    : { data: [] }

  // Build interest count map
  const interestCountMap = new Map<string, number>()
  ;(interestCounts || []).forEach((i: { value: string }) => {
    interestCountMap.set(i.value, (interestCountMap.get(i.value) || 0) + 1)
  })

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
    origin: client.origin || null,
    is_personal_shopper: client.is_personal_shopper || false,
    heat_score: client.heat_score || 50,
    seller_signal: (client as any).seller_signal || null,
    signal_note: (client as any).signal_note || null,
    signal_updated_at: (client as any).signal_updated_at || null,
    life_notes: (client as any).life_notes || null,
    locale: ((client as any).locale || 'local') as ClientLocale,
    first_impact: ((client as any).first_impact || 'unknown') as FirstImpact,
    created_at: client.created_at,
    updated_at: client.updated_at,
    seller_name: (() => {
      const s = client.seller as unknown as { full_name: string } | { full_name: string }[] | null
      return Array.isArray(s) ? s[0]?.full_name : s?.full_name
    })() || 'Unassigned',
    interests: (interests || []).map(i => ({
      ...i,
      domain: 'fashion' as 'fashion' | 'life',
    })),
    contact_history: (contacts || []).map(c => {
      const sellerData = c.seller as unknown as { full_name: string } | { full_name: string }[] | null
      const sellerName = Array.isArray(sellerData) ? sellerData[0]?.full_name : sellerData?.full_name
      return {
        id: c.id,
        date: c.contact_date,
        channel: c.channel as ContactChannel,
        comment: c.comment,
        seller: sellerName || 'Unknown',
      }
    }),
    purchase_history: (purchases || []).map(p => ({
      id: p.id,
      date: p.purchase_date,
      amount: p.amount,
      description: p.description,
      product_name: null,
      product_category: null,
      size: null,
      size_type: null,
      is_gift: false,
      gift_recipient: null,
    })),
    sizing: (sizing || []).map(s => ({
      id: s.id,
      category: s.category,
      size: s.size,
      fit_preference: s.fit_preference,
      notes: s.notes,
    })),
    known_sizes: ((knownSizes || []) as any[]).map((ks: any) => ({
      client_id: ks.client_id,
      category: ks.category,
      size: ks.size,
      size_type: ks.size_type,
      last_product: ks.last_product,
      last_purchase_date: ks.last_purchase_date,
    })) as KnownSizeItem[],
    visit_history: (visits || []).map(v => ({
      id: v.id,
      date: v.visit_date,
      duration_minutes: v.duration_minutes,
      tried_products: v.tried_products,
      notes: v.notes,
      converted: v.converted,
    })),
  }

  const canEdit = user.effectiveRole === 'supervisor' || clientData.seller_id === user.id

  let sellerOptions: { id: string; full_name: string }[] | undefined
  if (user.effectiveRole === 'supervisor') {
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
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
      email: 'E-mail',
      in_store: 'In-store',
      other: 'Other',
    }
    return labels[channel] || channel
  }

  const isPremium = ['grand_prix', 'diplomatico'].includes(clientData.tier)
  const timeline = buildTimeline(clientData)
  const nextMove = getNextMoveContext(clientData)

  return (
    <AppShell userRole={user.profile.role} effectiveRole={user.effectiveRole} userName={user.profile.full_name}>
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
                <p className="label mb-2 text-text-muted">Client profile</p>
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <h1 className="heading-1 text-text">
                    {clientData.first_name} {clientData.last_name}
                  </h1>
                  <TierBadge tier={clientData.tier} size="md" />
                  <OriginBadge origin={clientData.origin} size="md" />
                  <PersonalShopperBadge isPersonalShopper={clientData.is_personal_shopper} size="md" />
                  {clientData.locale === 'foreign' && (
                    <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                      Foreign
                    </span>
                  )}
                  {clientData.first_impact !== 'unknown' && (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${FIRST_IMPACT_CONFIG[clientData.first_impact].color}10`,
                        color: FIRST_IMPACT_CONFIG[clientData.first_impact].color,
                      }}
                      title={FIRST_IMPACT_CONFIG[clientData.first_impact].description}
                    >
                      {FIRST_IMPACT_CONFIG[clientData.first_impact].label} entry
                    </span>
                  )}
                </div>
                {/* Signal badge - primary seller assessment */}
                <div className="mt-3">
                  <ClientSignalSection
                    clientId={id}
                    clientName={`${clientData.first_name} ${clientData.last_name}`}
                    currentSignal={clientData.seller_signal}
                    signalNote={clientData.signal_note}
                    signalUpdatedAt={clientData.signal_updated_at}
                    canEdit={canEdit}
                  />
                </div>
                {/* Heat score - secondary system metric */}
                <div className="mt-2 flex items-center gap-2 opacity-60">
                  <span className="text-xs text-text-muted">Activite:</span>
                  <HeatIndicator score={clientData.heat_score} size="sm" />
                </div>
                <p className={`font-serif text-3xl ${isPremium ? 'text-gold' : 'text-primary'}`}>
                  {formatCurrency(clientData.total_spend)}
                  <span className="body-small ml-2 font-sans font-normal text-text-muted">
                    total spent
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="body-small text-text-muted">
                    Advisor: <span className="text-text">{clientData.seller_name}</span>
                  </p>
                  {user.effectiveRole === 'supervisor' && clientData.seller_id !== user.id && (
                    <NotifySellerButton
                      clientId={id}
                      sellerId={clientData.seller_id}
                      sellerName={clientData.seller_name}
                      clientName={`${clientData.first_name} ${clientData.last_name}`}
                    />
                  )}
                </div>
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
                      locale: clientData.locale,
                    }}
                    sellerOptions={sellerOptions}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 border-t pt-6 body-small" style={cardBorder}>
              {clientData.phone && (
                <a
                  href={`https://wa.me/${clientData.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2.5 rounded-sm px-5 py-3 text-sm font-medium text-white transition-colors duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Envoyer un message
                </a>
              )}
              <div className="flex flex-wrap gap-4">
                {clientData.phone && (
                  <a
                    href={`tel:${clientData.phone}`}
                    className="flex items-center gap-2 text-text hover:text-primary transition-colors"
                  >
                    <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/>
                    </svg>
                    {clientData.phone}
                  </a>
                )}
                {clientData.email && (
                  <a
                    href={`mailto:${clientData.email}`}
                    className="flex items-center gap-2 text-text hover:text-primary transition-colors"
                  >
                    <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                    </svg>
                    {clientData.email}
                  </a>
                )}
              </div>
            </div>

            <div
              className="mt-6 grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3"
              style={cardBorder}
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
                <p className="label mb-1 text-text-muted">Next follow-up</p>
                <p className="body-small text-text">{formatDate(clientData.next_recontact_date)}</p>
              </div>
            </div>

            <div className="mt-6 border-t pt-6" style={cardBorder}>
              <p className="label mb-2 text-text-muted">Profile notes</p>
              {clientData.notes ? (
                <p className="body whitespace-pre-wrap text-text">{clientData.notes}</p>
              ) : (
                <p className="body-small text-text-muted italic">
                  No notes — use "Edit profile" to add some.
                </p>
              )}
            </div>
          </section>

          {/* Next step */}
          <section className="border bg-surface p-6" style={cardBorder}>
            <p className="label mb-3 text-text-muted">Next step</p>
            <h2
              className={`mb-3 font-serif text-xl leading-snug ${
                nextMove.urgent ? 'text-danger' : 'text-text'
              }`}
            >
              {nextMove.headline}
            </h2>
            <p className="body-small mb-6 text-text-muted">{nextMove.detail}</p>
            <p className="label mb-2 text-text-muted">Quick actions</p>
            <p className="body-small text-text-muted">
              At the bottom: log a contact (updates dates) or{' '}
              <strong className="font-medium text-text">add a purchase</strong> (e.g. silk shirt + amount) to
              update total and tier.
            </p>
            <a
              href="#vendor-actions"
              className="label mt-4 inline-block text-primary hover:text-primary-soft"
            >
              Go to actions →
            </a>
          </section>

          {/* Profile completeness */}
          {canEdit && (() => {
            const fashionInterests = (clientData.interests || []).filter(i => i.domain !== 'life')
            const lifeInterests = (clientData.interests || []).filter(i => i.domain === 'life')

            const checks = [
              { label: 'Signal assessed', done: !!clientData.seller_signal, anchor: undefined as string | undefined },
              { label: 'Fashion interests', done: fashionInterests.length > 0, anchor: '#fashion-interests' },
              { label: 'Life interests', done: lifeInterests.length > 0, anchor: '#life-interests' },
              { label: 'Life notes', done: !!clientData.life_notes, anchor: '#life-interests' },
              { label: 'Client type set', done: clientData.locale !== 'local' || true, anchor: undefined },
              { label: 'Sizing data', done: (clientData.known_sizes || []).length > 0 || (clientData.sizing || []).length > 0, anchor: '#sizes' },
            ]

            const completed = checks.filter(c => c.done).length
            const total = checks.length
            const pct = Math.round((completed / total) * 100)
            const incomplete = checks.filter(c => !c.done)

            if (incomplete.length === 0) return null

            return (
              <section className="border bg-surface p-5" style={cardBorder}>
                <p className="label mb-3 text-text-muted">Profile completeness</p>
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-bg-soft overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct >= 80 ? '#2F6B4F' : pct >= 50 ? '#D97706' : '#C34747',
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-text-muted">{completed}/{total}</span>
                </div>
                <ul className="space-y-1.5">
                  {incomplete.map((check) => (
                    <li key={check.label} className="flex items-center gap-2 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                      {check.anchor ? (
                        <a href={check.anchor} className="text-text-muted hover:text-primary transition-colors">
                          {check.label}
                        </a>
                      ) : (
                        <span className="text-text-muted">{check.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })()}
        </div>

        {/* Fashion Interests */}
        <section id="fashion-interests" className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
          <p className="label mb-2 text-text-muted">Interets mode</p>
          <h2 className="mb-4 font-serif text-2xl text-text">Ce qu&apos;il aime</h2>
          {(() => {
            const fashionInterests = (clientData.interests || []).filter(i => i.domain !== 'life')
            return fashionInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fashionInterests.map((interest) => (
                  <InterestTag
                    key={interest.id}
                    category={interest.category}
                    value={interest.value}
                    detail={interest.detail}
                    domain="fashion"
                    clickable={true}
                    size="md"
                    count={Math.max(0, (interestCountMap.get(interest.value) || 0) - 1)}
                  />
                ))}
              </div>
            ) : (
              <p className="body-small text-text-muted">Aucun interet mode enregistre.</p>
            )
          })()}
          <ClientInterestAdd clientId={id} canEdit={canEdit} domain="fashion" />
        </section>

        {/* Life Interests */}
        <section id="life-interests" className="mt-6 border bg-surface p-6 md:p-8" style={{ ...cardBorder, borderLeftWidth: 3, borderLeftColor: 'rgba(14, 165, 233, 0.3)' }}>
          <p className="label mb-2 text-text-muted">Life</p>
          <h2 className="mb-4 font-serif text-2xl text-text">Qui il est</h2>
          {(() => {
            const lifeInterests = (clientData.interests || []).filter(i => i.domain === 'life')
            return lifeInterests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {lifeInterests.map((interest) => (
                  <InterestTag
                    key={interest.id}
                    category={interest.category}
                    value={interest.value}
                    detail={interest.detail}
                    domain="life"
                    clickable={true}
                    size="md"
                    count={Math.max(0, (interestCountMap.get(interest.value) || 0) - 1)}
                  />
                ))}
              </div>
            ) : (
              <p className="body-small text-text-muted">Aucun interet personnel enregistre.</p>
            )
          })()}
          <ClientInterestAdd clientId={id} canEdit={canEdit} domain="life" />
          <ClientLifeNotes
            clientId={id}
            initialNotes={clientData.life_notes}
            canEdit={canEdit}
          />
        </section>

        {/* Sizes — derived from purchases + manual */}
        <section id="sizes" className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
          <p className="label mb-2 text-text-muted">Sizes</p>
          <h2 className="mb-4 font-serif text-2xl text-text">From purchases</h2>
          {(() => {
            const derived = clientData.known_sizes || []
            const manualSizing = clientData.sizing || []
            const derivedCategories = new Set(derived.map(d => d.category))
            const manualOnly = manualSizing.filter(s => !derivedCategories.has(s.category.toLowerCase()))
            const categoryLabel = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1)

            if (derived.length === 0 && manualOnly.length === 0) {
              return <p className="body-small text-text-muted">No sizing data yet. Add purchases with size info to build this automatically.</p>
            }

            return (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b text-xs text-text-muted" style={cardBorder}>
                      <th className="pb-2 pr-4 font-medium">Category</th>
                      <th className="pb-2 pr-4 font-medium">Size</th>
                      <th className="pb-2 pr-4 font-medium">Source</th>
                      <th className="pb-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="body-small">
                    {derived.map((ks) => (
                      <tr key={ks.category} className="border-b last:border-0" style={cardBorder}>
                        <td className="py-2.5 pr-4 font-medium text-text">{categoryLabel(ks.category)}</td>
                        <td className="py-2.5 pr-4 font-serif text-lg text-text">{ks.size}</td>
                        <td className="py-2.5 pr-4 text-text-muted">{ks.last_product || '—'}</td>
                        <td className="py-2.5 text-text-muted">{ks.last_purchase_date ? formatDateShort(ks.last_purchase_date) : '—'}</td>
                      </tr>
                    ))}
                    {manualOnly.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 opacity-60" style={cardBorder}>
                        <td className="py-2.5 pr-4 font-medium text-text">{s.category}</td>
                        <td className="py-2.5 pr-4 font-serif text-lg text-text">{s.size}</td>
                        <td className="py-2.5 pr-4 text-text-muted italic">Manual{s.fit_preference ? ` · ${s.fit_preference}` : ''}</td>
                        <td className="py-2.5 text-text-muted">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </section>

        {/* Meetings */}
        <ClientMeetingsSection
          clientId={id}
          clientName={`${clientData.first_name} ${clientData.last_name}`}
          canEdit={canEdit}
        />

        {/* History */}
        <section className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
          <p className="label mb-2 text-text-muted">History</p>
          <h2 className="mb-6 font-serif text-2xl text-text">Contacts & purchases</h2>
          {timeline.length === 0 ? (
            <p className="body-small text-text-muted">
              Nothing in history yet. Use the actions below to log a contact or purchase.
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
                        <p className="body-small mt-2 text-text-muted">By {ev.data.seller}</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="body font-medium text-text">
                            {ev.data.product_name || 'Purchase'}
                            {ev.data.size && <span className="ml-2 text-text-muted font-normal text-sm">({ev.data.size})</span>}
                            {ev.data.is_gift && <span className="ml-2 text-xs text-rose-500">Gift</span>}
                          </p>
                          <p className="body-small text-text-muted">{formatDateShort(ev.data.date)}</p>
                          {ev.data.gift_recipient && (
                            <p className="body-small mt-0.5 text-rose-400 italic">For {ev.data.gift_recipient}</p>
                          )}
                          {ev.data.description && !ev.data.product_name && (
                            <p className="body-small mt-1 text-text">{ev.data.description}</p>
                          )}
                          {ev.data.product_category && (
                            <p className="body-small mt-0.5 text-text-muted capitalize">{ev.data.product_category}</p>
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
          <p className="label mb-2 text-text-muted md:hidden">Seller actions</p>
          <ClientActions clientId={id} />
        </div>
      </div>
    </AppShell>
  )
}
