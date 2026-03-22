'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModalPortal } from '@/components/ModalPortal'

export interface SellerPick {
  id: string
  full_name: string
}

interface Props {
  onClose: () => void
  isSupervisor?: boolean
  sellers?: SellerPick[]
}

export function AddClientModal({ onClose, isSupervisor, sellers = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sellerId, setSellerId] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    const data: Record<string, unknown> = {
      first_name: String(fd.get('first_name') ?? '').trim(),
      last_name: String(fd.get('last_name') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim() || null,
      email: String(fd.get('email') ?? '').trim() || null,
      notes: String(fd.get('notes') ?? '').trim() || null,
    }

    if (isSupervisor) {
      const sid = String(fd.get('seller_id') ?? '').trim()
      if (!sid) {
        setError('Select the seller who owns this client')
        setLoading(false)
        return
      }
      data.seller_id = sid
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Failed to create client')
      }

      const clientId = json.id

      // If initial purchase amount provided, add it
      const initialPurchase = parseFloat(String(fd.get('initial_purchase') ?? '0'))
      if (initialPurchase > 0 && clientId) {
        await fetch(`/api/clients/${clientId}/purchases`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: initialPurchase,
            description: 'Initial purchase',
          }),
        })
      }

      // Refresh and close
      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/40 p-4 py-10"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="my-auto w-full max-w-md border bg-surface p-6 shadow-lg"
          style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-client-title"
        >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="add-client-title" className="font-serif text-xl text-text">
            New client
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-text-muted transition-colors hover:text-text"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto pr-1">
          {isSupervisor && sellers.length === 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
              No active sellers found. Add seller accounts in Supabase before creating clients for them.
            </p>
          )}
          {isSupervisor && sellers.length > 0 && (
            <div>
              <label className="small-caps block mb-1">Assigned seller *</label>
              <select
                name="seller_id"
                className="input-field"
                value={sellerId}
                onChange={(e) => setSellerId(e.target.value)}
                required
              >
                <option value="">Select seller…</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="small-caps block mb-1">First Name *</label>
              <input
                name="first_name"
                required
                className="input-field"
                placeholder="Jean"
              />
            </div>
            <div>
              <label className="small-caps block mb-1">Last Name *</label>
              <input
                name="last_name"
                required
                className="input-field"
                placeholder="Dupont"
              />
            </div>
          </div>

          <div>
            <label className="small-caps block mb-1">Phone</label>
            <input
              name="phone"
              type="tel"
              className="input-field"
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div>
            <label className="small-caps block mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="input-field"
              placeholder="jean@example.com"
            />
          </div>

          <div>
            <label className="small-caps block mb-1">Initial Purchase (€)</label>
            <input
              name="initial_purchase"
              type="number"
              min="0"
              step="0.01"
              className="input-field"
              placeholder="0"
            />
            <p className="body-small mt-1 text-text-muted">Sets the initial tier (total spent).</p>
          </div>

          <div>
            <label className="small-caps block mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="input-field"
              placeholder="Any notes about the client..."
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create client'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </ModalPortal>
  )
}
