'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { MissedOpportunityModal } from './MissedOpportunityModal'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'

interface Props {
  clientId: string
  sellerName: string
}

const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' } as const

function ResultBadge({ result }: { result: 'Good' | 'Missed' }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
      style={{
        backgroundColor: result === 'Missed' ? 'rgba(195, 71, 71, 0.08)' : 'rgba(47, 107, 79, 0.08)',
        color: result === 'Missed' ? 'var(--danger)' : 'var(--success)',
      }}
    >
      {result}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-4 py-3" style={{ borderTop: '0.5px solid var(--faint)' }}>
      <p className="w-28 shrink-0 label text-text-muted pt-0.5">{label}</p>
      <p className="body-small text-text flex-1">{value}</p>
    </div>
  )
}

export function MissedOpportunitySection({ clientId, sellerName }: Props) {
  const [items, setItems] = useState<MissedOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch(`/api/missed-opportunities?client_id=${clientId}`)
        if (res.ok) {
          const json = await res.json()
          setItems(json.data ?? [])
        }
      } catch {
        // silent — section degrades gracefully
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [clientId])

  const handleCreated = (mo: MissedOpportunity) => {
    setItems((prev) => [mo, ...prev])
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      <MissedOpportunityModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onCreated={handleCreated}
        clientId={clientId}
        sellerName={sellerName}
      />

      <section className="mt-6 border bg-surface p-6 md:p-8" style={cardBorder}>
        {/* Section header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-text-muted" strokeWidth={1.5} />
            <div>
              <p className="label text-text-muted">Missed Opportunities</p>
              <h2 className="mt-0.5 font-serif text-2xl text-text">Sales gaps</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium uppercase tracking-[0.12em] text-primary transition-colors hover:bg-primary/5 border border-primary/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Report
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-sm bg-bg-soft" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="body-small italic text-text-muted">
            No missed opportunities recorded for this client.
          </p>
        ) : (
          <ol className="space-y-0">
            {items.map((mo) => {
              const isExpanded = expandedId === mo.id
              return (
                <li
                  key={mo.id}
                  className="border-b last:border-b-0"
                  style={{ borderColor: 'var(--faint)' }}
                >
                  {/* Row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : mo.id)}
                    className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-bg-soft/40"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <ResultBadge result={mo.result} />
                        <span className="label text-text-muted">{mo.missed_type}</span>
                        <span className="body-small text-text-muted">·</span>
                        <span className="body-small text-text-muted">{formatDate(mo.date)}</span>
                      </div>
                      {mo.description && (
                        <p className="body-small truncate text-text">{mo.description}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-text-muted">
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />
                      }
                    </span>
                  </button>

                  {/* Inline detail */}
                  {isExpanded && (
                    <div
                      className="mb-4 ml-0 px-1 pb-2"
                      style={{ borderLeft: '2px solid var(--faint)', marginLeft: '4px', paddingLeft: '16px' }}
                    >
                      <p className="label mb-3 text-text-muted">By {mo.seller_name}</p>
                      <DetailRow label="What happened" value={mo.description} />
                      <DetailRow label="Cause" value={mo.cause} />
                      <DetailRow label="Impact" value={mo.impact} />
                      <DetailRow label="Next action" value={mo.recommended_action} />
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </>
  )
}
