'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'

interface Props {
  clientId: string
  canEdit: boolean
}

export function ClientInterestAdd({ clientId, canEdit }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [value, setValue] = useState('')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!canEdit) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/interests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category.trim(),
          value: value.trim(),
          detail: detail.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setCategory('')
      setValue('')
      setDetail('')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="label text-primary transition-colors duration-200 hover:text-primary-soft"
        >
          + Add an interest
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label mb-1 block text-text-muted">Category</label>
              <input
                className="input-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Products"
                required
              />
            </div>
            <div>
              <label className="label mb-1 block text-text-muted">Value</label>
              <input
                className="input-field"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. Silk shirts"
                required
              />
            </div>
          </div>
          <div>
            <label className="label mb-1 block text-text-muted">Details (optional)</label>
            <input
              className="input-field"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Size, color, collection..."
            />
          </div>
          {error && <p className="body-small text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={loading}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null) }}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
