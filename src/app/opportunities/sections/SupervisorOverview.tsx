'use client'

import Link from 'next/link'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { DormantVip, SellerFollowUp } from '../data/aggregate'

interface Props {
  reportedThisWeek: MissedOpportunity[]
  dormantVips: DormantVip[]
  sellersNeedingFollowUp: SellerFollowUp[]
}

const TIER_LABEL: Record<string, string> = {
  rainbow: 'Rainbow',
  diplomatico: 'Diplomatico',
  grand_prix: 'Grand Prix',
  optimisto: 'Optimisto',
  kaizen: 'Kaizen',
  idealiste: 'Idealiste',
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:gap-10">
      <p
        className="md:w-28 shrink-0 text-[10px] font-medium uppercase tracking-[0.18em]"
        style={{ color: 'var(--warmgrey)' }}
      >
        {label}
      </p>
      <p
        className="text-base leading-[1.7] md:text-[17px] md:leading-[1.7]"
        style={{ color: 'var(--ink)' }}
      >
        {children}
      </p>
    </div>
  )
}

function joinWithCommas(nodes: React.ReactNode[]): React.ReactNode[] {
  const out: React.ReactNode[] = []
  nodes.forEach((node, i) => {
    if (i > 0) {
      out.push(i === nodes.length - 1 ? ', and ' : ', ')
    }
    out.push(node)
  })
  return out
}

export function SupervisorOverview({
  reportedThisWeek,
  dormantVips,
  sellersNeedingFollowUp,
}: Props) {
  const dormantSentence =
    dormantVips.length === 0 ? (
      'No dormant VIPs surfaced this week.'
    ) : (() => {
        const names = dormantVips.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}`}
            className="underline-offset-4 transition-colors hover:underline"
            style={{ color: 'var(--ink)' }}
          >
            {c.first_name} {c.last_name}
          </Link>
        ))
        const tiers = Array.from(new Set(dormantVips.map((c) => TIER_LABEL[c.tier] ?? c.tier)))
        const tierPart = tiers.length === 1 ? `${tiers[0]} tier` : tiers.join(' and ') + ' tiers'
        const maxDays = Math.max(...dormantVips.map((c) => c.daysSinceLastContact))
        const daysPart = Number.isFinite(maxDays) && maxDays < 9999 ? `${maxDays}+ days since last contact` : 'long-silent'
        return (
          <>
            {joinWithCommas(names)} have gone quiet. {tierPart}, {daysPart}.
          </>
        )
      })()

  const reportedSentence =
    reportedThisWeek.length === 0
      ? 'No sales gaps reported in the last seven days.'
      : reportedThisWeek.length === 1
        ? 'One sales gap reported this week.'
        : `${reportedThisWeek.length} sales gaps reported this week.`

  const sellersSentence =
    sellersNeedingFollowUp.length === 0 ? (
      'No seller flagged for follow-up this month.'
    ) : (
      <>
        {joinWithCommas(
          sellersNeedingFollowUp.slice(0, 3).map((s) => (
            <span key={s.seller_id || s.seller_name} style={{ color: 'var(--ink)' }}>
              {s.seller_name}
            </span>
          )),
        )}
        {' '}have flagged multiple gaps in the last 30 days.
      </>
    )

  return (
    <section className="pb-14 md:pb-16">
      <h2 className="heading-2 mb-8" style={{ color: 'var(--ink)' }}>
        Overview
      </h2>

      <div
        className="divide-y"
        style={{
          borderTop: '0.5px solid var(--faint)',
          borderBottom: '0.5px solid var(--faint)',
        }}
      >
        <Row label="This week">{reportedSentence}</Row>
        <Row label="Dormant">{dormantSentence}</Row>
        <Row label="Sellers">{sellersSentence}</Row>
      </div>
    </section>
  )
}
