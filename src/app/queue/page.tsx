import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, TierBadge } from '@/components'
import { RecontactQueueItem } from '@/lib/types'
import Link from 'next/link'

export default async function QueuePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: queue } = await supabase
    .from('recontact_queue')
    .select('*')
    .order('days_overdue', { ascending: false })

  const items = (queue || []) as RecontactQueueItem[]

  // Group by status
  const overdue = items.filter(i => (i.days_overdue ?? 0) > 0)
  const dueToday = items.filter(i => (i.days_overdue ?? 0) === 0)
  const upcoming = items.filter(i => (i.days_overdue ?? 0) < 0)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '—'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const QueueSection = ({ title, items, urgent = false }: { title: string; items: RecontactQueueItem[]; urgent?: boolean }) => {
    if (items.length === 0) return null

    return (
      <section className="mb-8">
        <h2 className={`small-caps mb-4 ${urgent ? 'text-red-600' : 'text-ink/60'}`}>
          {title} ({items.length})
        </h2>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/clients/${item.id}`}
              className={`
                block card hover:shadow-md transition-shadow
                ${urgent ? 'border-l-4 border-l-red-500' : ''}
              `}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-serif text-lg">
                      {item.first_name} {item.last_name}
                    </h3>
                    <TierBadge tier={item.tier!} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-ink/50">
                    {item.phone && (
                      <a
                        href={`tel:${item.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-green"
                      >
                        {item.phone}
                      </a>
                    )}
                    <span>{formatCurrency(item.total_spend)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-ink/50 text-xs">Last contact</p>
                    <p>{formatDate(item.last_contact_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-ink/50 text-xs">Due</p>
                    <p className={urgent ? 'text-red-600 font-medium' : ''}>
                      {formatDate(item.next_recontact_date)}
                      {(item.days_overdue ?? 0) > 0 && (
                        <span className="ml-1 text-red-600">
                          +{item.days_overdue}d
                        </span>
                      )}
                    </p>
                  </div>

                  {item.phone && (
                    <a
                      href={`https://wa.me/${item.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-green/10 text-green rounded hover:bg-green/20 transition-colors"
                      title="WhatsApp"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="mb-2">Recontact Queue</h1>
          <p className="text-ink/60">
            {items.length} client{items.length !== 1 ? 's' : ''} to contact
          </p>
        </header>

        {items.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-ink/50 mb-2">No contacts due</p>
            <p className="narrator">All caught up for now</p>
          </div>
        ) : (
          <>
            <QueueSection title="Overdue" items={overdue} urgent />
            <QueueSection title="Due Today" items={dueToday} />
            <QueueSection title="Upcoming" items={upcoming} />
          </>
        )}
      </div>
    </AppShell>
  )
}
