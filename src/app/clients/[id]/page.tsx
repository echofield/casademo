import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import { Client360 } from '@/lib/types'
import Link from 'next/link'
import { ClientActions } from './ClientActions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Client360Page({ params }: Props) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { id } = await params
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .rpc('get_client_360', { client_id: id })
    .single()

  if (error || !client) {
    notFound()
  }

  const clientData = client as Client360

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
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

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/clients"
          className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink mb-6 transition-colors"
        >
          <span>&larr;</span>
          <span>Back to Clients</span>
        </Link>

        {/* Header */}
        <header className="card mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl">
                  {clientData.first_name} {clientData.last_name}
                </h1>
                <TierBadge tier={clientData.tier} size="md" />
              </div>
              <p className="text-2xl font-serif text-green mb-3">
                {formatCurrency(clientData.total_spend)}
              </p>
              <p className="text-sm text-ink/50">
                Managed by {clientData.seller_name}
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm">
              {clientData.phone && (
                <a
                  href={`tel:${clientData.phone}`}
                  className="flex items-center gap-2 text-ink hover:text-green transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {clientData.phone}
                </a>
              )}
              {clientData.email && (
                <a
                  href={`mailto:${clientData.email}`}
                  className="flex items-center gap-2 text-ink hover:text-green transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {clientData.email}
                </a>
              )}
              {clientData.phone && (
                <a
                  href={`https://wa.me/${clientData.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-green hover:opacity-80 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-grey-light text-sm text-ink/60">
            <div>
              <span className="small-caps mr-2">First Contact</span>
              {formatDate(clientData.first_contact_date)}
            </div>
            <div>
              <span className="small-caps mr-2">Last Contact</span>
              {formatDate(clientData.last_contact_date)}
            </div>
            <div>
              <span className="small-caps mr-2">Next Recontact</span>
              {formatDate(clientData.next_recontact_date)}
            </div>
          </div>
        </header>

        {/* Actions */}
        <ClientActions clientId={id} />

        {/* Notes */}
        {clientData.notes && (
          <section className="card mb-6">
            <h2 className="small-caps text-ink/60 mb-3">Notes</h2>
            <p className="text-ink/80 whitespace-pre-wrap">{clientData.notes}</p>
          </section>
        )}

        {/* Interests */}
        <section className="card mb-6">
          <h2 className="small-caps text-ink/60 mb-4">Interests</h2>
          {clientData.interests && clientData.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {clientData.interests.map((interest) => (
                <span
                  key={interest.id}
                  className="px-3 py-1 bg-grey-light/50 text-sm"
                  title={interest.detail || undefined}
                >
                  <span className="text-ink/50">{interest.category}:</span>{' '}
                  {interest.value}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-ink/40 text-sm">No interests recorded yet</p>
          )}
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact History */}
          <section className="card">
            <h2 className="small-caps text-ink/60 mb-4">Contact History</h2>
            {clientData.contact_history && clientData.contact_history.length > 0 ? (
              <div className="space-y-4">
                {clientData.contact_history.map((contact) => (
                  <div key={contact.id} className="border-l-2 border-grey-light pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{formatChannel(contact.channel)}</span>
                      <span className="text-xs text-ink/40">{formatDate(contact.date)}</span>
                    </div>
                    {contact.comment && (
                      <p className="text-sm text-ink/70">{contact.comment}</p>
                    )}
                    <p className="text-xs text-ink/40 mt-1">by {contact.seller}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink/40 text-sm">No contacts recorded yet</p>
            )}
          </section>

          {/* Purchase History */}
          <section className="card">
            <h2 className="small-caps text-ink/60 mb-4">Purchase History</h2>
            {clientData.purchase_history && clientData.purchase_history.length > 0 ? (
              <div className="space-y-3">
                {clientData.purchase_history.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between py-2 border-b border-grey-light/50 last:border-0">
                    <div>
                      <p className="text-sm">{formatDate(purchase.date)}</p>
                      {purchase.description && (
                        <p className="text-xs text-ink/50">{purchase.description}</p>
                      )}
                    </div>
                    <span className="font-serif text-green">
                      {formatCurrency(purchase.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-ink/40 text-sm">No purchases recorded yet</p>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}
