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
