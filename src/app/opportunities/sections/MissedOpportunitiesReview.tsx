'use client'

import Link from 'next/link'
import { useMemo } from 'react'
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
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p
            className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em]"
            style={{ color: 'var(--warmgrey)' }}
          >
            Reported sales gaps
          </p>
          <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
            Missed opportunities
          </h2>
          <p
            className="max-w-xl text-sm"
            style={{ color: 'var(--ink-soft)', opacity: 0.75 }}
          >
            Consolidated across sellers. Review, prioritise, and turn into a recovery action.
          </p>
        </div>
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
                className="mb-4 text-[10px] font-medium uppercase tracking-[0.14em]"
                style={{ color: 'var(--warmgrey)' }}
              >
                {weekLabel(week)}
              </p>
              <ul
                className="divide-y"
                style={{ borderTop: '0.5px solid var(--faint)', borderBottom: '0.5px solid var(--faint)' }}
              >
                {items.map((m) => {
                  const client = m.client_id ? clientMap.get(m.client_id) : null
                  const estimated = extractEurFromImpact(m.impact)
                  return (
                    <li key={m.id} className="py-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span
                              className="text-xs font-medium uppercase tracking-[0.12em]"
                              style={{
                                color:
                                  m.result === 'Missed'
                                    ? 'var(--danger, #c34747)'
                                    : 'var(--success, #2f6b4f)',
                              }}
                            >
                              {m.missed_type}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--warmgrey)' }}>·</span>
                            {client ? (
                              <Link
                                href={`/clients/${client.id}`}
                                className="text-sm transition-colors hover:underline"
                                style={{ color: 'var(--ink)' }}
                              >
                                {client.first_name} {client.last_name}
                              </Link>
                            ) : (
                              <span className="text-sm" style={{ color: 'var(--warmgrey)' }}>
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
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {m.description && (
                            <p className="mb-2 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
                              {m.description}
                            </p>
                          )}
                          <div className="grid gap-2 text-sm md:grid-cols-2" style={{ color: 'var(--ink-soft)' }}>
                            {m.cause && (
                              <p>
                                <span className="uppercase tracking-[0.1em] text-[10px] mr-2" style={{ color: 'var(--warmgrey)' }}>Cause</span>
                                {m.cause}
                              </p>
                            )}
                            {m.recommended_action && (
                              <p>
                                <span className="uppercase tracking-[0.1em] text-[10px] mr-2" style={{ color: 'var(--warmgrey)' }}>Next</span>
                                {m.recommended_action}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-8 md:min-w-[160px] md:justify-end">
                          <div className="text-right">
                            <p
                              className="text-[10px] font-medium uppercase tracking-[0.14em]"
                              style={{ color: 'var(--warmgrey)' }}
                            >
                              Estimated impact
                            </p>
                            <p className="mt-1 font-serif text-lg" style={{ color: 'var(--ink)' }}>
                              {estimated > 0 ? formatEur(estimated) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
