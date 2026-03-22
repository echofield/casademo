'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'

// Casablanca-aligned interest templates
const INTEREST_OPTIONS: Record<string, string[]> = {
  Products: ['Silk shirts', 'T-shirts', 'Knitwear', 'Shorts', 'Tracksuits', 'Sneakers', 'Accessories', 'Trousers', 'Outerwear'],
  Collections: ['Tennis Club', 'Maison De Rêve', 'Gradient Wave', 'Monogram', 'Sunset Landscape'],
  Styles: ['Printed', 'Crochet', 'Knitted', 'Tailored', 'Graphic', 'Relaxed'],
  Colors: ['Green', 'Gold', 'Navy', 'White', 'Multicolor', 'Black', 'Red'],
  Occasions: ['Resort', 'Leisure', 'Evening', 'Travel', 'Sport'],
  Lifestyle: ['Tennis', 'Golf', 'Motorsport', 'Yachting', 'Art', 'Music', 'Wine', 'Watches', 'Travel', 'Fitness'],
}

const CATEGORIES = Object.keys(INTEREST_OPTIONS)

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

  const availableValues = category ? INTEREST_OPTIONS[category] || [] : []

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setValue('') // Reset value when category changes
  }

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
              <select
                className="input-field w-full"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label mb-1 block text-text-muted">Value</label>
              <select
                className="input-field w-full"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                disabled={!category}
              >
                <option value="">{category ? 'Select value' : 'Select category first'}</option>
                {availableValues.map((val) => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label mb-1 block text-text-muted">Details (optional)</label>
            <input
              className="input-field"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Prefers seasonal releases, specific sizes..."
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
