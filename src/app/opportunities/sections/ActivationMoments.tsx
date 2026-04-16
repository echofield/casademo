'use client'

import { useMemo, useState } from 'react'
import type { ActivationMoment } from '../data/activationMoments'
import { ACCESS_TYPE_LABEL } from '../data/activationMoments'
import { formatEurRange } from '../data/aggregate'

interface Props {
  moments: ActivationMoment[]
}

type Filter = 'all' | 'heritage' | 'concierge' | 'selective'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'heritage', label: 'Heritage' },
  { id: 'concierge', label: 'Concierge' },
  { id: 'selective', label: 'Selective' },
]

const CATEGORY_LABEL: Record<ActivationMoment['category'], string> = {
  heritage: 'Heritage',
  concierge: 'Concierge',
  selective: 'Selective',
}

function MomentCard({ m }: { m: ActivationMoment }) {
  return (
    <article
      className="flex flex-col gap-6 border bg-[var(--paper)] p-6 md:p-8"
      style={{ borderColor: 'var(--faint)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            {CATEGORY_LABEL[m.category]}
          </span>
          <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: 'var(--warmgrey)' }}>
            {ACCESS_TYPE_LABEL[m.access.type]}
          </span>
        </div>
      </div>

      <div>
        <h3 className="font-serif text-2xl leading-tight" style={{ color: 'var(--ink)' }}>
          {m.title}
        </h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--ink-soft)' }}>
          {m.venue} · {m.dateWindow}
        </p>
      </div>

      <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
        <div>
          <p
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Why now
          </p>
          <p style={{ color: 'var(--ink)' }}>{m.whyNow}</p>
        </div>
        <div>
          <p
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Client angle
          </p>
          <p style={{ color: 'var(--ink)' }}>{m.clientAngle}</p>
        </div>
        <div>
          <p
            className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Suggested action
          </p>
          <p style={{ color: 'var(--ink)' }}>{m.suggestedAction}</p>
        </div>
      </div>

      <div
        className="mt-2 flex flex-wrap items-end justify-between gap-4 border-t pt-5"
        style={{ borderColor: 'var(--faint)' }}
      >
        <div>
          <p
            className="text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Access
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--ink)' }}>
            {m.access.providerLabel}
          </p>
        </div>
        <div className="text-right">
          <p
            className="text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Estimated potential
          </p>
          <p className="mt-1 font-serif text-lg" style={{ color: 'var(--ink)' }}>
            {formatEurRange(m.estimatedPotentialEur)}
          </p>
        </div>
      </div>
    </article>
  )
}

export function ActivationMoments({ moments }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () => (filter === 'all' ? moments : moments.filter((m) => m.category === filter)),
    [moments, filter],
  )

  return (
    <section
      className="border-t pt-14 pb-14 md:pt-16 md:pb-16"
      style={{ borderColor: 'var(--faint)' }}
    >
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Client activation
          </p>
          <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
            Activation moments
          </h2>
          <p
            className="max-w-xl text-sm"
            style={{ color: 'var(--ink-soft)', opacity: 0.75 }}
          >
            Curated windows where a specific client or client-type is most receptive. Access coordinated through the appropriate channel.
          </p>
        </div>

        <div className="flex items-center gap-6" style={{ borderBottom: '0.5px solid var(--faint)' }}>
          {FILTERS.map((f) => {
            const active = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className="relative pb-2 text-xs font-medium uppercase tracking-[0.12em] transition-colors"
                style={{ color: active ? 'var(--ink)' : 'var(--warmgrey)' }}
              >
                {f.label}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ backgroundColor: 'var(--ink)' }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
          No moments in this category yet.
        </p>
      ) : (
        <div className="grid gap-px bg-[var(--faint)] sm:grid-cols-2">
          {visible.map((m) => (
            <MomentCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </section>
  )
}
