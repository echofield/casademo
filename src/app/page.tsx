import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell, RecontactQueueSection } from '@/components'
import { RecontactQueueItem } from '@/lib/types'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: queue } = await supabase
    .from('recontact_queue')
    .select('*')
    .order('days_overdue', { ascending: false })

  const items = (queue || []) as RecontactQueueItem[]

  const overdue = items.filter((i) => (i.days_overdue ?? 0) > 0)
  const dueToday = items.filter((i) => (i.days_overdue ?? 0) === 0)
  const upcoming = items.filter((i) => (i.days_overdue ?? 0) < 0)

  const urgentTotal = overdue.length + dueToday.length

  return (
    <AppShell userRole={user.profile.role} userName={user.profile.full_name}>
      <div className="mx-auto max-w-4xl animate-fade-in">
        <header className="mb-10">
          <p className="label mb-3 text-text-muted">Overview</p>
          <h1 className="heading-1 text-text">Good day{user.profile.full_name ? `, ${user.profile.full_name.split(' ')[0]}` : ''}</h1>
          <p className="body mt-2 max-w-xl text-text-muted">
            Here&apos;s how your portfolio looks today — and the fastest place to act.
          </p>
        </header>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryStat label="Total due" value={items.length} />
          <SummaryStat label="Overdue" value={overdue.length} tone={overdue.length > 0 ? 'danger' : 'default'} />
          <SummaryStat label="Due today" value={dueToday.length} tone={dueToday.length > 0 ? 'gold' : 'default'} />
          <SummaryStat label="Upcoming" value={upcoming.length} />
        </div>

        <div
          className="mb-12 border bg-surface p-6 md:p-8"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
        >
          <p className="label mb-2 text-text-muted">Next step</p>
          {items.length === 0 ? (
            <p className="font-serif text-2xl text-text">You&apos;re fully caught up.</p>
          ) : (
            <>
              <p className="mb-6 font-serif text-2xl leading-snug text-text md:text-3xl">
                {urgentTotal > 0 ? (
                  <>
                    <span className={overdue.length > 0 ? 'text-danger' : 'text-gold'}>{urgentTotal}</span>{' '}
                    {urgentTotal === 1 ? 'client needs' : 'clients need'} your attention
                    {overdue.length > 0 && dueToday.length > 0 ? ' today or earlier' : overdue.length > 0 ? ' now' : ' today'}
                    .
                  </>
                ) : (
                  <>No urgent items — {upcoming.length} upcoming recontact{upcoming.length !== 1 ? 's' : ''} in the queue.</>
                )}
              </p>
              <Link
                href="/queue"
                className="inline-flex items-center justify-center bg-primary px-8 py-3.5 text-xs font-medium uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-primary-soft"
              >
                Work the queue
              </Link>
            </>
          )}
        </div>

        {items.length === 0 ? (
          <div
            className="border bg-surface py-14 text-center"
            style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          >
            <p className="text-text-muted">No contacts due in the queue.</p>
            <p className="narrator mt-2">Enjoy the calm.</p>
          </div>
        ) : (
          <>
            <p className="label mb-6 text-text-muted">By priority</p>
            <RecontactQueueSection title="Overdue" items={overdue} urgent />
            <RecontactQueueSection title="Due today" items={dueToday} />
            <RecontactQueueSection title="Upcoming" items={upcoming} />
          </>
        )}
      </div>
    </AppShell>
  )
}

function SummaryStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: number
  tone?: 'default' | 'danger' | 'gold'
}) {
  const valueClass =
    tone === 'danger' ? 'text-danger' : tone === 'gold' ? 'text-gold' : 'text-text'
  return (
    <div
      className="border bg-surface px-4 py-4"
      style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
    >
      <p className="label mb-2 text-text-muted">{label}</p>
      <p className={`metric-small ${valueClass}`}>{value}</p>
    </div>
  )
}
