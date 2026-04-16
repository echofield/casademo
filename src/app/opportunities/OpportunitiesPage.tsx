'use client'

import { useMemo } from 'react'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { Client360 } from '@/lib/types'
import type { ActivationMoment } from './data/activationMoments'
import {
  computeMetrics,
  topClientsToReactivate,
  sellersNeedingFollowUp,
  reportedThisWeek,
  resolveMomentClients,
} from './data/aggregate'
import { OpportunityHero } from './sections/OpportunityHero'
import { SupervisorOverview } from './sections/SupervisorOverview'
import { MissedOpportunitiesReview } from './sections/MissedOpportunitiesReview'
import { ActivationMoments } from './sections/ActivationMoments'
import { RecommendedActions } from './sections/RecommendedActions'

interface Props {
  missed: MissedOpportunity[]
  clients: Client360[]
  moments: ActivationMoment[]
}

export function OpportunitiesPage({ missed, clients, moments }: Props) {
  const dormant = useMemo(() => topClientsToReactivate(clients, 3), [clients])
  const sellers = useMemo(() => sellersNeedingFollowUp(missed), [missed])
  const weekReported = useMemo(() => reportedThisWeek(missed), [missed])
  const metrics = useMemo(
    () => computeMetrics(missed, moments, dormant.length),
    [missed, moments, dormant.length],
  )
  const clientsByMoment = useMemo(
    () => resolveMomentClients(moments, clients),
    [moments, clients],
  )

  return (
    <div className="mx-auto max-w-6xl">
      <OpportunityHero metrics={metrics} />

      <SupervisorOverview
        reportedThisWeek={weekReported}
        dormantVips={dormant}
        sellersNeedingFollowUp={sellers}
      />

      <MissedOpportunitiesReview missed={missed} clients={clients} />

      <ActivationMoments moments={moments} clientsByMoment={clientsByMoment} />

      <RecommendedActions
        missed={missed}
        moments={moments}
        dormantVips={dormant}
        sellersNeedingFollowUp={sellers}
      />
    </div>
  )
}
