import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { AppShell } from '@/components'
import { isDemoMode } from '@/lib/demo/config'
import {
  getDemoMissedOpportunities,
  getDemoClients,
} from '@/lib/demo/presentation-data'
import { createClient } from '@/lib/supabase/server'
import { ACTIVATION_MOMENTS } from './data/activationMoments'
import { OpportunitiesPage } from './OpportunitiesPage'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { Client360 } from '@/lib/types'

export const metadata = {
  title: 'Opportunities — Casa One',
}

export const dynamic = 'force-dynamic'

export default async function OpportunitiesRoute() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.effectiveRole !== 'supervisor') redirect('/')

  let missed: MissedOpportunity[] = []
  let clients: Client360[] = []

  if (isDemoMode) {
    missed = getDemoMissedOpportunities()
    clients = getDemoClients() as unknown as Client360[]
  } else {
    try {
      const supabase = await createClient()
      const [missedRes, clientsRes] = await Promise.all([
        supabase
          .from('missed_opportunities')
          .select('*')
          .order('date', { ascending: false })
          .limit(200),
        supabase
          .from('clients')
          .select('*')
          .limit(500),
      ])
      missed = (missedRes.data ?? []) as MissedOpportunity[]
      clients = (clientsRes.data ?? []) as Client360[]
    } catch {
      // Degrade gracefully: fall back to demo fixtures if the live query fails
      missed = getDemoMissedOpportunities()
      clients = getDemoClients() as unknown as Client360[]
    }
  }

  // ACTIVATION_MOMENTS and PIECES_TO_MATCH reference demo fixture IDs
  // (e.g. client-daphne-kim). Merge demo roster into the client pool so
  // moment/piece resolvers can always surface named clients, even when
  // Supabase-backed clients use different IDs.
  const demoClients = getDemoClients() as unknown as Client360[]
  const seenIds = new Set(clients.map((c) => c.id))
  for (const dc of demoClients) {
    if (!seenIds.has(dc.id)) clients.push(dc)
  }

  return (
    <AppShell
      userRole={user.profile.role}
      effectiveRole={user.effectiveRole}
      userName={user.profile.full_name}
    >
      <OpportunitiesPage
        missed={missed}
        clients={clients}
        moments={ACTIVATION_MOMENTS}
      />
    </AppShell>
  )
}
