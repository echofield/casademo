'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
    <div className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50">
      <div className="bg-paper w-full max-w-md p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl">Add Client</h2>
          <button
            onClick={onClose}
            className="text-ink/50 hover:text-ink"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <p className="text-xs text-ink/50 mt-1">Sets starting tier automatically</p>
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

          <div className="flex gap-3 pt-2">
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
              {loading ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
