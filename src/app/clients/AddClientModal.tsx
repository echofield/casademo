'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
}

export function AddClientModal({ onClose }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const fd = new FormData(form)

    const data = {
      first_name: String(fd.get('first_name') ?? '').trim(),
      last_name: String(fd.get('last_name') ?? '').trim(),
      phone: String(fd.get('phone') ?? '').trim() || null,
      email: String(fd.get('email') ?? '').trim() || null,
      notes: String(fd.get('notes') ?? '').trim() || null,
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
