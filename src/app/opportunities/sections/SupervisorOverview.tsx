'use client'

import Link from 'next/link'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { DormantVip, SellerFollowUp } from '../data/aggregate'

interface Props {
  reportedThisWeek: MissedOpportunity[]
  dormantVips: DormantVip[]
  sellersNeedingFollowUp: SellerFollowUp[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-5 text-[10px] font-medium uppercase tracking-[0.14em]"
      style={{ color: 'var(--warmgrey)' }}
    >
      {children}
    </p>
  )
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <p className="text-sm italic" style={{ color: 'var(--warmgrey)' }}>
      {text}
    </p>
  )
}

const TIER_LABEL: Record<string, string> = {
  rainbow: 'Rainbow',
  diplomatico: 'Diplomatico',
  grand_prix: 'Grand Prix',
  optimisto: 'Optimisto',
  kaizen: 'Kaizen',
  idealiste: 'Idealiste',
}

export function SupervisorOverview({
  reportedThisWeek,
  dormantVips,
  sellersNeedingFollowUp,
}: Props) {
  return (
    <section className="pb-14 md:pb-16">
      <div className="mb-8">
        <h2 className="heading-2 mb-2" style={{ color: 'var(--ink)' }}>
          Overview
        </h2>
        <p
          className="max-w-xl text-sm"
          style={{ color: 'var(--ink-soft)', opacity: 0.75 }}
        >
          Key signals, quietly surfaced.
        </p>
      </div>

      <div className="grid gap-10 md:grid-cols-3 md:gap-12">
        <Column title="Reported this week">
          {reportedThisWeek.length === 0 ? (
            <Empty text="Nothing reported in the last seven days." />
          ) : (
            reportedThisWeek.slice(0, 4).map((m) => (
              <div key={m.id} className="text-sm leading-relaxed">
                <p style={{ color: 'var(--ink)' }}>{m.missed_type}</p>
                <p className="mt-0.5" style={{ color: 'var(--warmgrey)' }}>
                  {m.seller_name} · {new Date(m.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))
          )}
        </Column>

        <Column title="Dormant VIPs to reactivate">
          {dormantVips.length === 0 ? (
            <Empty text="No dormant VIPs surfaced." />
          ) : (
            dormantVips.map((c) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="group block text-sm leading-relaxed"
              >
                <p
                  className="transition-colors group-hover:underline"
                  style={{ color: 'var(--ink)' }}
                >
                  {c.first_name} {c.last_name}
                </p>
                <p className="mt-0.5" style={{ color: 'var(--warmgrey)' }}>
                  {TIER_LABEL[c.tier] ?? c.tier} · {c.daysSinceLastContact === 9999 ? 'no recent contact' : `${c.daysSinceLastContact}d since last contact`}
                </p>
              </Link>
            ))
          )}
        </Column>

        <Column title="Sellers needing follow-up">
          {sellersNeedingFollowUp.length === 0 ? (
            <Empty text="No sellers flagged this month." />
          ) : (
            sellersNeedingFollowUp.slice(0, 4).map((s) => (
              <div key={s.seller_id || s.seller_name} className="text-sm leading-relaxed">
                <p style={{ color: 'var(--ink)' }}>{s.seller_name}</p>
                <p className="mt-0.5" style={{ color: 'var(--warmgrey)' }}>
                  {s.missedCount} missed · last 30 days
                </p>
              </div>
            ))
          )}
        </Column>
      </div>
    </section>
  )
}
