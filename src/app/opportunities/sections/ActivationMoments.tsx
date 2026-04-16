'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { ActivationMoment, MomentBucket } from '../data/activationMoments'
import { TOUCHPOINT_LABEL } from '../data/activationMoments'
import { formatEurRange } from '../data/aggregate'
import type { Client360 } from '@/lib/types'

interface Props {
  moments: ActivationMoment[]
  clientsByMoment: Map<string, Client360[]>
}

type Filter = 'all' | MomentBucket

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'existing', label: 'Existing client' },
  { id: 'acquisition', label: 'New prospect' },
]

const BUCKET_CHIP_LABEL: Record<MomentBucket, string> = {
  existing: 'Existing client',
  acquisition: 'New prospect',
}

const TIER_LABEL: Record<string, string> = {
  rainbow: 'Rainbow',
  diplomatico: 'Diplomatico',
  grand_prix: 'Grand Prix',
  optimisto: 'Optimisto',
  kaizen: 'Kaizen',
  idealiste: 'Idealiste',
}

function BucketGlyph({ bucket }: { bucket: MomentBucket }) {
  if (bucket === 'existing') {
    return (
      <span
        className="inline-block h-[7px] w-[7px] rounded-full"
        style={{ backgroundColor: 'var(--gold)' }}
        aria-hidden
      />
    )
  }
  return (
    <span
      className="inline-block h-[7px] w-[7px] rounded-full"
      style={{ border: '1px solid var(--gold)' }}
      aria-hidden
    />
  )
}

function ClientChip({ client, interestTag }: { client: Client360; interestTag: string }) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="group inline-flex flex-wrap items-center gap-x-2 gap-y-1"
    >
      <span
        className="text-sm transition-colors group-hover:underline underline-offset-4"
        style={{ color: 'var(--ink)' }}
      >
        {client.first_name} {client.last_name}
      </span>
      <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
      <span
        className="text-[11px] font-medium uppercase tracking-[0.12em]"
        style={{ color: 'var(--warmgrey)' }}
      >
        {TIER_LABEL[client.tier] ?? client.tier}
      </span>
      <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
      <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        {interestTag}
      </span>
    </Link>
  )
}

function ProspectChip({
  tier,
  interestTag,
  channel,
}: {
  tier: string
  interestTag: string
  channel: string
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className="text-sm italic"
        style={{ color: 'var(--ink)' }}
      >
        Prospect
      </span>
      <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
      <span
        className="text-[11px] font-medium uppercase tracking-[0.12em]"
        style={{ color: 'var(--warmgrey)' }}
      >
        {TIER_LABEL[tier] ?? tier}
      </span>
      <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
      <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        {interestTag}
      </span>
      <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
      <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>
        {channel}
      </span>
    </div>
  )
}

function MomentCard({
  m,
  index,
  total,
  resolvedClients,
}: {
  m: ActivationMoment
  index: number
  total: number
  resolvedClients: Client360[]
}) {
  const bandColor = m.bucket === 'existing' ? 'var(--paper-dim)' : 'var(--faint)'
  const ordinal = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`

  return (
    <article
      className="flex flex-col bg-[var(--paper)]"
      style={{ border: '0.5px solid var(--faint)' }}
    >
      <div className="h-[3px] w-full" style={{ backgroundColor: bandColor }} aria-hidden />

      <div className="flex flex-1 flex-col gap-6 p-6 md:p-7">
        <div className="flex items-center justify-between gap-4">
          <span
            className="text-[10px] font-medium uppercase tracking-[0.18em] tabular-nums"
            style={{ color: 'var(--warmgrey)' }}
          >
            {ordinal}
          </span>
          <div className="flex items-center gap-2">
            <BucketGlyph bucket={m.bucket} />
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              {BUCKET_CHIP_LABEL[m.bucket]}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-serif text-2xl leading-[1.25]" style={{ color: 'var(--ink)' }}>
            {m.title}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--warmgrey)' }}>
            {m.dateWindow}
          </p>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {m.contextLine}
        </p>

        <div className="flex flex-col gap-2">
          {m.pairing.type === 'existing'
            ? resolvedClients.map((c) => (
                <ClientChip key={c.id} client={c} interestTag={m.pairing.interestTag} />
              ))
            : (
                <ProspectChip
                  tier={m.pairing.tier}
                  interestTag={m.pairing.interestTag}
                  channel={m.pairing.channel}
                />
              )}
        </div>

        <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink)' }}>
          {m.proposition}
        </p>

        <div
          className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t pt-5"
          style={{ borderColor: 'var(--faint)' }}
        >
          <div>
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              Touchpoint
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--ink)' }}>
              {TOUCHPOINT_LABEL[m.touchpoint]}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              Estimated potential
            </p>
            <p
              className="mt-1 font-serif text-lg"
              style={{ color: 'var(--success)' }}
            >
              {formatEurRange(m.estimatedPotentialEur)}
            </p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function ActivationMoments({ moments, clientsByMoment }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(
    () => (filter === 'all' ? moments : moments.filter((m) => m.bucket === filter)),
    [moments, filter],
  )

  return (
    <section
      className="border-t pt-14 pb-14 md:pt-16 md:pb-16"
      style={{ borderColor: 'var(--faint)' }}
    >
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p
            className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Client activation
          </p>
          <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
            Activation moments
          </h2>
          <p
            className="max-w-xl text-sm"
            style={{ color: 'var(--ink-soft)', opacity: 0.78 }}
          >
            Strict pairings of a named client with a contextual moment and a Casa One-delivered experience. Acquisition moments surface prospect profiles only.
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
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {visible.map((m, i) => (
            <MomentCard
              key={m.id}
              m={m}
              index={i}
              total={visible.length}
              resolvedClients={clientsByMoment.get(m.id) ?? []}
            />
          ))}
        </div>
      )}
    </section>
  )
}
