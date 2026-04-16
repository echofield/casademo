'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { Client360 } from '@/lib/types'
import { extractEurFromImpact, formatEur } from '../data/aggregate'

interface Props {
  missed: MissedOpportunity[]
  clients: Client360[]
}

function startOfIsoWeek(d: Date): Date {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  x.setHours(0, 0, 0, 0)
  return x
}

function weekKey(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 'unknown'
  return startOfIsoWeek(d).toISOString().slice(0, 10)
}

function weekLabel(key: string): string {
  if (key === 'unknown') return 'Unknown week'
  const start = new Date(key)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (x: Date) =>
    x.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  return `Week of ${fmt(start)} \u2013 ${fmt(end)}`
}

function MissedRow({
  m,
  client,
}: {
  m: MissedOpportunity
  client: Client360 | null
}) {
  const [open, setOpen] = useState(false)
  const estimated = extractEurFromImpact(m.impact)
  const hasDetail = Boolean(m.cause || m.recommended_action)

  return (
    <li className="py-4">
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className="flex w-full items-center gap-4 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.14em]"
              style={{
                color:
                  m.result === 'Missed'
                    ? 'var(--danger, #c34747)'
                    : 'var(--success)',
              }}
            >
              {m.missed_type}
            </span>
            <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
            {client ? (
              <Link
                href={`/clients/${client.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-sm underline-offset-4 hover:underline"
                style={{ color: 'var(--ink)' }}
              >
                {client.first_name} {client.last_name}
              </Link>
            ) : (
              <span className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
                No client attached
              </span>
            )}
            <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
            <span className="text-sm" style={{ color: 'var(--warmgrey)' }}>
              {m.seller_name}
            </span>
            <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
            <span className="text-sm" style={{ color: 'var(--warmgrey)' }}>
              {new Date(m.date).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          {m.description && (
            <p
              className="mt-1.5 truncate text-sm leading-relaxed"
              style={{ color: 'var(--ink)' }}
            >
              {m.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <div className="text-right">
            <p
              className="text-[9px] font-medium uppercase tracking-[0.14em]"
              style={{ color: 'var(--warmgrey)' }}
            >
              Impact
            </p>
            <p
              className="mt-0.5 font-serif text-base"
              style={{ color: 'var(--ink)' }}
            >
              {estimated > 0 ? formatEur(estimated) : '—'}
            </p>
          </div>
          {hasDetail && (
            <span style={{ color: 'var(--warmgrey)' }}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          )}
        </div>
      </button>

      {open && hasDetail && (
        <div
          className="mt-4 ml-1 grid gap-3 pl-4 text-sm md:grid-cols-2"
          style={{ borderLeft: '2px solid var(--faint)' }}
        >
          {m.cause && (
            <div>
              <p
                className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ color: 'var(--warmgrey)' }}
              >
                Cause
              </p>
              <p style={{ color: 'var(--ink-soft)' }}>{m.cause}</p>
            </div>
          )}
          {m.recommended_action && (
            <div>
              <p
                className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ color: 'var(--warmgrey)' }}
              >
                Next action
              </p>
              <p style={{ color: 'var(--ink-soft)' }}>{m.recommended_action}</p>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

export function MissedOpportunitiesReview({ missed, clients }: Props) {
  const clientMap = useMemo(() => {
    const map = new Map<string, Client360>()
    for (const c of clients) map.set(c.id, c)
    return map
  }, [clients])

  const grouped = useMemo(() => {
    const buckets = new Map<string, MissedOpportunity[]>()
    for (const m of missed) {
      const k = weekKey(m.date)
      const arr = buckets.get(k) ?? []
      arr.push(m)
      buckets.set(k, arr)
    }
    return Array.from(buckets.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [missed])

  return (
    <section
      className="border-t pt-14 pb-14 md:pt-16 md:pb-16"
      style={{ borderColor: 'var(--faint)' }}
    >
      <div className="mb-10">
        <p
          className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em]"
          style={{ color: 'var(--warmgrey)' }}
        >
          Reported sales gaps
        </p>
        <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
          Missed opportunities
        </h2>
        <p
          className="max-w-xl text-sm"
          style={{ color: 'var(--ink-soft)', opacity: 0.78 }}
        >
          Consolidated across sellers. Tap a row to see the cause and the next move.
        </p>
      </div>

      {missed.length === 0 ? (
        <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
          No missed opportunities reported yet.
        </p>
      ) : (
        <div className="space-y-12">
          {grouped.map(([week, items]) => (
            <div key={week}>
              <p
                className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em]"
                style={{ color: 'var(--warmgrey)' }}
              >
                {weekLabel(week)}
              </p>
              <ul
                className="divide-y"
                style={{
                  borderTop: '0.5px solid var(--faint)',
                  borderBottom: '0.5px solid var(--faint)',
                }}
              >
                {items.map((m) => (
                  <MissedRow
                    key={m.id}
                    m={m}
                    client={m.client_id ? clientMap.get(m.client_id) ?? null : null}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
