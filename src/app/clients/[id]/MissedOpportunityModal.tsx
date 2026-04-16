'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { ModalPortal } from '@/components/ModalPortal'
import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { SellerOption } from '@/app/api/sellers/route'

const MISSED_TYPES = [
  'No show',
  'Price objection',
  'Wrong timing',
  'Wrong product',
  'Lost to competitor',
  'Client not ready',
  'Internal conflict',
  'Other',
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onCreated: (mo: MissedOpportunity) => void
  clientId: string
  /** The seller assigned to this client — used as the default. */
  defaultSellerId: string | null
  defaultSellerName: string
}

export function MissedOpportunityModal({
  isOpen,
  onClose,
  onCreated,
  clientId,
  defaultSellerId,
  defaultSellerName,
}: Props) {
  const today = new Date().toISOString().split('T')[0]

  const [date, setDate] = useState(today)
  const [sellerId, setSellerId] = useState<string>(defaultSellerId ?? '')
  const [sellerName, setSellerName] = useState(defaultSellerName)
  const [result, setResult] = useState<'Missed' | 'Good'>('Missed')
  const [missedType, setMissedType] = useState('')
  const [description, setDescription] = useState('')
  const [cause, setCause] = useState('')
  const [impact, setImpact] = useState('')
  const [action, setAction] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sellers, setSellers] = useState<SellerOption[]>([])
  const [sellersLoaded, setSellersLoaded] = useState(false)

  // Load sellers once on first open
  useEffect(() => {
    if (!isOpen || sellersLoaded) return
    fetch('/api/sellers')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setSellers(json.data)
      })
      .catch(() => {})
      .finally(() => setSellersLoaded(true))
  }, [isOpen, sellersLoaded])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(today)
      setSellerId(defaultSellerId ?? '')
      setSellerName(defaultSellerName)
      setResult('Missed')
      setMissedType('')
      setDescription('')
      setCause('')
      setImpact('')
      setAction('')
      setError(null)
    }
  }, [defaultSellerId, defaultSellerName, isOpen, today])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSellerChange = (id: string) => {
    setSellerId(id)
    const found = sellers.find((s) => s.id === id)
    if (found) setSellerName(found.full_name)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!missedType) { setError('Please select a type.'); return }
    if (!sellerName.trim()) { setError('Please select a seller.'); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/missed-opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          seller_id: sellerId || null,
          seller_name: sellerName,
          client_id: clientId,
          result,
          missed_type: missedType,
          description,
          cause,
          impact,
          recommended_action: action,
        }),
      })

      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Save failed.'); return }
      onCreated(json.data)
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalPortal>
      {/* Backdrop — z-50 sits above the sticky nav (z-40) */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report missed opportunity"
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      >
        <div
          className="w-full max-w-xl border bg-surface shadow-sm"
          style={{ borderColor: 'rgba(28, 27, 25, 0.12)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5"
            style={{ borderBottom: '0.5px solid var(--faint)' }}
          >
            <div>
              <p className="label text-text-muted">Missed Opportunity</p>
              <h2 className="mt-0.5 font-sans text-base font-medium text-text">Report a sales gap</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center text-text-muted transition-opacity hover:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Row 1: Date + Result */}
            <div className="mb-5 flex gap-4">
              <div className="flex-1">
                <label className="label mb-1.5 block text-text-muted">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border-b border-text-muted/20 bg-transparent py-2 text-sm text-text focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="label mb-1.5 block text-text-muted">Result</label>
                <div className="flex gap-2 pt-1">
                  {(['Missed', 'Good'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setResult(r)}
                      className="px-3 py-1.5 text-xs font-medium uppercase tracking-[0.1em] transition-colors"
                      style={{
                        backgroundColor: result === r
                          ? r === 'Missed' ? 'var(--danger)' : 'var(--success)'
                          : 'transparent',
                        color: result === r ? '#fff' : 'var(--ink-soft)',
                        border: `1px solid ${result === r
                          ? r === 'Missed' ? 'var(--danger)' : 'var(--success)'
                          : 'var(--faint)'}`,
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Seller + Type */}
            <div className="mb-5 flex gap-4">
              <div className="flex-1">
                <label className="label mb-1.5 block text-text-muted">
                  Seller
                  <span className="ml-1 font-normal normal-case tracking-normal opacity-60">(who handled this)</span>
                </label>
                {sellers.length > 0 ? (
                  <select
                    value={sellerId}
                    onChange={(e) => handleSellerChange(e.target.value)}
                    className="w-full border-b border-text-muted/20 bg-transparent py-2 text-sm text-text focus:border-primary focus:outline-none"
                  >
                    <option value="">Select a seller...</option>
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="Seller name..."
                    className="w-full border-b border-text-muted/20 bg-transparent py-2 text-sm text-text placeholder:text-text-muted/40 focus:border-primary focus:outline-none"
                  />
                )}
              </div>
              <div className="flex-1">
                <label className="label mb-1.5 block text-text-muted">Type</label>
                <select
                  value={missedType}
                  onChange={(e) => setMissedType(e.target.value)}
                  className="w-full border-b border-text-muted/20 bg-transparent py-2 text-sm text-text focus:border-primary focus:outline-none"
                  required
                >
                  <option value="">Select a type...</option>
                  {MISSED_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2x2 textarea grid */}
            <div className="mb-5 grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-1.5 block text-text-muted">What happened</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Brief description..."
                  className="w-full resize-none border border-text-muted/15 bg-transparent p-3 text-sm text-text placeholder:text-text-muted/40 focus:border-primary/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="label mb-1.5 block text-text-muted">Cause</label>
                <textarea
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  rows={3}
                  placeholder="Root cause..."
                  className="w-full resize-none border border-text-muted/15 bg-transparent p-3 text-sm text-text placeholder:text-text-muted/40 focus:border-primary/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="label mb-1.5 block text-text-muted">Impact</label>
                <textarea
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                  rows={3}
                  placeholder="Estimated impact..."
                  className="w-full resize-none border border-text-muted/15 bg-transparent p-3 text-sm text-text placeholder:text-text-muted/40 focus:border-primary/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="label mb-1.5 block text-text-muted">Next action</label>
                <textarea
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  rows={3}
                  placeholder="Recommended action..."
                  className="w-full resize-none border border-text-muted/15 bg-transparent p-3 text-sm text-text placeholder:text-text-muted/40 focus:border-primary/40 focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-danger">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-medium uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    </ModalPortal>
  )
}
