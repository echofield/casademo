'use client'

import { formatEur } from '../data/aggregate'
import type { OpportunityMetrics } from '../data/aggregate'

interface Props {
  metrics: OpportunityMetrics
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-[10px] font-medium uppercase tracking-[0.14em]"
        style={{ color: 'var(--warmgrey)' }}
      >
        {label}
      </p>
      <p className="font-serif text-3xl md:text-4xl" style={{ color: 'var(--ink)' }}>
        {value}
      </p>
    </div>
  )
}

export function OpportunityHero({ metrics }: Props) {
  return (
    <section className="pt-8 pb-10 md:pt-12 md:pb-14">
      <div className="mb-12">
        <p
          className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--warmgrey)' }}
        >
          Supervisor view
        </p>
        <h1 className="heading-1 mb-4" style={{ color: 'var(--ink)' }}>
          Opportunities
        </h1>
        <p
          className="max-w-2xl text-base leading-relaxed"
          style={{ color: 'var(--ink-soft)' }}
        >
          A global view of clients, events, and reported sales gaps worth acting on.
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-b py-8 md:grid-cols-4"
        style={{ borderColor: 'var(--faint)' }}
      >
        <Metric label="Value at stake" value={formatEur(metrics.valueAtStakeEur)} />
        <Metric label="Open opportunities" value={String(metrics.openCount)} />
        <Metric label="Missed reported" value={String(metrics.missedCount)} />
        <Metric label="Active moments" value={String(metrics.activeMomentsCount)} />
      </div>
    </section>
  )
}
