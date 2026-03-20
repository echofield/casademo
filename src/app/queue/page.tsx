import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AppShell, RecontactQueueSection } from '@/components'
import { RecontactQueueItem } from '@/lib/types'

export default async function QueuePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: queue } = await supabase
    .from('recontact_queue')
    .select('*')
    .order('days_overdue', { ascending: false })

  const items = (queue || []) as RecontactQueueItem[]

  const overdue = items.filter(i => (i.days_overdue ?? 0) > 0)
  const dueToday = items.filter(i => (i.days_overdue ?? 0) === 0)
  const upcoming = items.filter(i => (i.days_overdue ?? 0) < 0)

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
            <RecontactQueueSection title="Overdue" items={overdue} urgent />
            <RecontactQueueSection title="Due Today" items={dueToday} />
            <RecontactQueueSection title="Upcoming" items={upcoming} />
          </>
        )}
      </div>
    </AppShell>
  )
}
