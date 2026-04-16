'use client'

import { useMemo } from 'react'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import { getDemoClients } from '@/lib/demo/presentation-data'
import type { Client360 } from '@/lib/types'
import type { ActivationMoment } from './data/activationMoments'
import {
  computeMetrics,
  topClientsToReactivate,
  sellersNeedingFollowUp,
  reportedThisWeek,
  resolveMomentClients,
  resolvePieceClient,
} from './data/aggregate'
import { PIECES_TO_MATCH } from './data/pieces'
import { OpportunityHero } from './sections/OpportunityHero'
import { SupervisorOverview } from './sections/SupervisorOverview'
import { MissedOpportunitiesReview } from './sections/MissedOpportunitiesReview'
import { ActivationMoments } from './sections/ActivationMoments'
import { PiecesToMatch } from './sections/PiecesToMatch'
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

  // ACTIVATION_MOMENTS and PIECES_TO_MATCH reference fixture client IDs.
  // Always resolve those names against the demo roster (merged with whatever
  // live client data exists) so the named pairings render in every environment.
  const resolutionPool = useMemo<Client360[]>(() => {
    const fixture = getDemoClients() as unknown as Client360[]
    const seen = new Set<string>()
    const merged: Client360[] = []
    for (const c of clients) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      merged.push(c)
    }
    for (const c of fixture) {
      if (seen.has(c.id)) continue
      seen.add(c.id)
      merged.push(c)
    }
    return merged
  }, [clients])

  const clientsByMoment = useMemo(
    () => resolveMomentClients(moments, resolutionPool),
    [moments, resolutionPool],
  )
  const clientByPiece = useMemo(
    () => resolvePieceClient(PIECES_TO_MATCH, resolutionPool),
    [resolutionPool],
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

      <PiecesToMatch pieces={PIECES_TO_MATCH} clientByPiece={clientByPiece} />

      <RecommendedActions
        missed={missed}
        moments={moments}
        dormantVips={dormant}
        sellersNeedingFollowUp={sellers}
      />
    </div>
  )
}
