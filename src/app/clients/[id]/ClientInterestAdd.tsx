'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components'

interface TaxonomyItem {
  category: string
  value: string
  display_label: string
}

interface Props {
  clientId: string
  canEdit: boolean
  domain: 'product' | 'life'
}

export function ClientInterestAdd({ clientId, canEdit, domain }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [value, setValue] = useState('')
  const [detail, setDetail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([])
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false)

  useEffect(() => {
    if (open && !taxonomyLoaded) {
      fetch(`/api/taxonomy?domain=${domain}`)
        .then(res => res.json())
        .then((data: TaxonomyItem[]) => {
          setTaxonomy(data || [])
          setTaxonomyLoaded(true)
        })
        .catch(() => setTaxonomyLoaded(true))
    }
  }, [open, taxonomyLoaded, domain])

  if (!canEdit) return null

  const categories = Array.from(new Set(taxonomy.map(t => t.category)))
  const availableValues = taxonomy.filter(t => t.category === category)

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    setValue('')
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
          domain,
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

  const label = domain === 'life' ? 'Add a life interest' : 'Add an interest'
  const categoryLabel = (cat: string) => cat.charAt(0).toUpperCase() + cat.slice(1)

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="label text-primary transition-colors duration-200 hover:text-primary-soft"
        >
          + {label}
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
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{categoryLabel(cat)}</option>
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
                {availableValues.map((item) => (
                  <option key={item.value} value={item.value}>{item.display_label}</option>
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
