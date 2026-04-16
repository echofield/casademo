'use client'

import { formatEur } from '../data/aggregate'
import type { OpportunityMetrics } from '../data/aggregate'

interface Props {
  metrics: OpportunityMetrics
}

/**
 * Editorial paragraph-hero. Intentionally avoids a KPI grid so the top of the
 * page doesn't read as a dashboard. Figures are carried inside running prose;
 * the Value-at-stake figure is the only number anchored visually, in green.
 */
export function OpportunityHero({ metrics }: Props) {
  const openLabel = metrics.openCount === 1 ? 'opportunity' : 'opportunities'
  const missedLabel =
    metrics.missedCount === 0
      ? 'No sales gaps reported in the last seven days.'
      : metrics.missedCount === 1
        ? 'One sales gap reported this week.'
        : `${metrics.missedCount} sales gaps reported this week.`
  const momentsLabel =
    metrics.activeMomentsCount === 1 ? 'One moment live.' : `${metrics.activeMomentsCount} moments live.`

  return (
    <section className="py-16 md:py-20">
      <p
        className="mb-6 text-[10px] font-medium uppercase tracking-[0.18em]"
        style={{ color: 'var(--warmgrey)' }}
      >
        Supervisor view · Today
      </p>

      <h1 className="heading-1 mb-10" style={{ color: 'var(--ink)' }}>
        Opportunities
      </h1>

      <p
        className="max-w-3xl text-lg leading-[1.7] md:text-xl md:leading-[1.7]"
        style={{ color: 'var(--ink)' }}
      >
        {metrics.openCount} client {openLabel} to open, worth roughly{' '}
        <span
          className="font-serif"
          style={{ color: 'var(--success)' }}
        >
          {formatEur(metrics.valueAtStakeEur)}
        </span>{' '}
        at the midpoint. {momentsLabel} {missedLabel}
      </p>

      <div
        className="mt-10 border-t pt-6"
        style={{ borderColor: 'var(--faint)' }}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--warmgrey)' }}
        >
          One client, one experience.
        </p>
      </div>
    </section>
  )
}
