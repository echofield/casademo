'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { ActivationMoment } from '../data/activationMoments'
import type { DormantVip, SellerFollowUp } from '../data/aggregate'
import { formatEurRange, extractEurFromImpact, formatEur } from '../data/aggregate'

interface Props {
  missed: MissedOpportunity[]
  moments: ActivationMoment[]
  dormantVips: DormantVip[]
  sellersNeedingFollowUp: SellerFollowUp[]
}

type Play = {
  id: string
  kind: 'recovery' | 'activation' | 'reactivation' | 'coaching'
  title: string
  detail: string
  value?: string
  href?: string
}

function buildPlays({
  missed,
  moments,
  dormantVips,
  sellersNeedingFollowUp,
}: Props): Play[] {
  const plays: Play[] = []

  // Recovery: the single highest-value missed opportunity still marked "Missed"
  const topMissed = [...missed]
    .filter((m) => m.result === 'Missed')
    .map((m) => ({ m, v: extractEurFromImpact(m.impact) }))
    .sort((a, b) => b.v - a.v)[0]
  if (topMissed) {
    plays.push({
      id: `recovery-${topMissed.m.id}`,
      kind: 'recovery',
      title: 'Turn the highest-value missed moment into a recovery action',
      detail: topMissed.m.recommended_action || topMissed.m.description,
      value: topMissed.v > 0 ? formatEur(topMissed.v) : undefined,
      href: topMissed.m.client_id ? `/clients/${topMissed.m.client_id}` : undefined,
    })
  }

  // Activation: the highest upside heritage or concierge moment
  const topMoment = [...moments].sort(
    (a, b) => b.estimatedPotentialEur.max - a.estimatedPotentialEur.max,
  )[0]
  if (topMoment) {
    plays.push({
      id: `activation-${topMoment.id}`,
      kind: 'activation',
      title: `Align sellers around ${topMoment.title}`,
      detail: topMoment.suggestedAction,
      value: formatEurRange(topMoment.estimatedPotentialEur),
    })
  }

  // Reactivation: surface the most dormant VIP
  const topDormant = dormantVips[0]
  if (topDormant) {
    plays.push({
      id: `reactivation-${topDormant.id}`,
      kind: 'reactivation',
      title: `Reactivate ${topDormant.first_name} ${topDormant.last_name}`,
      detail:
        topDormant.daysSinceLastContact === 9999
          ? 'No recent contact recorded. Reassign to a senior advisor.'
          : `Dormant for ${topDormant.daysSinceLastContact} days. Schedule a discreet touchpoint.`,
      href: `/clients/${topDormant.id}`,
    })
  }

  // Coaching: the seller with the most recent missed count
  const topSeller = sellersNeedingFollowUp[0]
  if (topSeller) {
    plays.push({
      id: `coaching-${topSeller.seller_id || topSeller.seller_name}`,
      kind: 'coaching',
      title: `Coach ${topSeller.seller_name}`,
      detail: `${topSeller.missedCount} missed moments in the last 30 days. Review causes and align next plays.`,
    })
  }

  return plays
}

const KIND_LABEL: Record<Play['kind'], string> = {
  recovery: 'Recovery',
  activation: 'Activation',
  reactivation: 'Reactivation',
  coaching: 'Coaching',
}

export function RecommendedActions(props: Props) {
  const plays = useMemo(() => buildPlays(props), [props])

  return (
    <section
      className="border-t pt-14 pb-16 md:pt-16 md:pb-20"
      style={{ borderColor: 'var(--faint)' }}
    >
      <div className="mb-10">
        <p
          className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em]"
          style={{ color: 'var(--warmgrey)' }}
        >
          Next moves
        </p>
        <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
          Recommended actions
        </h2>
        <p
          className="max-w-xl text-sm"
          style={{ color: 'var(--ink-soft)', opacity: 0.75 }}
        >
          {'Four plays derived from what\u2019s on the page above.'}
        </p>
      </div>

      {plays.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
          Nothing to act on yet.
        </p>
      ) : (
        <ol
          className="grid gap-px bg-[var(--faint)] md:grid-cols-2"
        >
          {plays.map((p) => {
            const body = (
              <div className="flex h-full flex-col gap-3 bg-[var(--paper)] p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span
                    className="text-[10px] font-medium uppercase tracking-[0.14em]"
                    style={{ color: 'var(--warmgrey)' }}
                  >
                    {KIND_LABEL[p.kind]}
                  </span>
                  {p.value && (
                    <span className="text-sm" style={{ color: 'var(--ink)' }}>
                      {p.value}
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-xl leading-tight" style={{ color: 'var(--ink)' }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {p.detail}
                </p>
                {p.href && (
                  <span
                    className="mt-auto text-[11px] font-medium uppercase tracking-[0.14em]"
                    style={{ color: 'var(--ink)' }}
                  >
                    {'Open client \u2192'}
                  </span>
                )}
              </div>
            )
            return (
              <li key={p.id} className="h-full">
                {p.href ? (
                  <Link href={p.href} className="block h-full transition-colors hover:bg-[var(--paper)]/80">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
