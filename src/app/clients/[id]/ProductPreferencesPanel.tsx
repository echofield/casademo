'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChipSelector } from '@/components/ChipSelector'
import { InterestTag } from '@/components/InterestTag'
import type { InterestItem } from '@/lib/types'

interface TaxonomyItem {
  category: string
  value: string
  display_label: string
}

interface Props {
  clientId: string
  interests: InterestItem[]
  canEdit: boolean
}

const CATEGORIES = ['products', 'fit', 'colors', 'materials', 'styles', 'avoided'] as const

const CATEGORY_LABELS: Record<string, string> = {
  products: 'Preferred Categories',
  fit: 'Fits',
  colors: 'Colors',
  materials: 'Materials',
  styles: 'Styles',
  avoided: 'Avoided Items',
}

export function ProductPreferencesPanel({ clientId, interests, canEdit }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([])
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false)
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const grouped = interests.reduce<Record<string, InterestItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const buildInitialSelections = () => {
    const sel: Record<string, string[]> = {}
    for (const cat of CATEGORIES) {
      sel[cat] = (grouped[cat] || []).map(i => i.value)
    }
    return sel
  }

  useEffect(() => {
    if (!editing || taxonomyLoaded) return
    fetch('/api/taxonomy?domain=product')
      .then(r => r.json())
      .then((data: TaxonomyItem[]) => {
        setTaxonomy(data)
        setTaxonomyLoaded(true)
      })
      .catch(() => setTaxonomyLoaded(true))
  }, [editing, taxonomyLoaded])

  const enterEditMode = () => {
    setSelections(buildInitialSelections())
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setSelections({})
  }

  const handleDelete = async (interestId: string) => {
    setDeleting(interestId)
    try {
      const res = await fetch(`/api/clients/${clientId}/interests/${interestId}`, {
        method: 'DELETE',
      })
      if (res.ok) router.refresh()
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const existingByCategory: Record<string, Set<string>> = {}
      for (const cat of CATEGORIES) {
        existingByCategory[cat] = new Set((grouped[cat] || []).map(i => i.value))
      }

      const newInterests: { category: string; value: string; domain: string }[] = []
      for (const cat of CATEGORIES) {
        for (const val of selections[cat] || []) {
          if (!existingByCategory[cat].has(val)) {
            newInterests.push({ category: cat, value: val, domain: 'product' })
          }
        }
      }

      if (newInterests.length > 0) {
        await fetch(`/api/clients/${clientId}/interests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interests: newInterests }),
        })
      }

      router.refresh()
      setEditing(false)
      setSelections({})
    } finally {
      setSaving(false)
    }
  }

  const updateCategorySelection = (category: string, values: string[]) => {
    setSelections(prev => ({ ...prev, [category]: values }))
  }

  const taxonomyOptions = (category: string) =>
    taxonomy
      .filter(t => t.category === category)
      .map(t => ({ value: t.value, label: t.display_label }))

  /* ── Read mode ── */
  if (!editing) {
    const hasAny = CATEGORIES.some(cat => grouped[cat]?.length)

    return (
      <div className="space-y-4">
        {!hasAny && (
          <p className="body-small text-text-muted">No product preferences recorded.</p>
        )}

        {CATEGORIES.map(cat => {
          const items = grouped[cat]
          if (!items?.length) return null
          return (
            <div key={cat} className="space-y-1.5">
              <span className="label">{CATEGORY_LABELS[cat]}</span>
              <div className="flex flex-wrap gap-1.5">
                {items.map(interest => (
                  <span key={interest.id} className="inline-flex items-center gap-1">
                    <InterestTag
                      category={interest.category}
                      value={interest.value}
                      clickable
                      size="md"
                    />
                    {canEdit && (
                      confirmDelete === interest.id ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="text-text-muted">Remove?</span>
                          <button
                            onClick={() => handleDelete(interest.id)}
                            disabled={deleting === interest.id}
                            className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-text-muted hover:text-text font-medium"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(interest.id)}
                          className="text-text-muted hover:text-text text-xs leading-none -ml-0.5"
                          aria-label={`Remove ${interest.value}`}
                        >
                          ×
                        </button>
                      )
                    )}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {canEdit && (
          <button
            onClick={enterEditMode}
            className="label text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    )
  }

  /* ── Edit mode ── */
  return (
    <div className="space-y-0">
      {CATEGORIES.map((cat, idx) => (
        <div key={cat}>
          {idx > 0 && (
            <div
              className="border-t my-4"
              style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
            />
          )}
          <div className="space-y-2">
            <span className="label">{CATEGORY_LABELS[cat]}</span>
            {taxonomyLoaded ? (
              <ChipSelector
                options={taxonomyOptions(cat)}
                selected={selections[cat] || []}
                onChange={vals => updateCategorySelection(cat, vals)}
                allowCustom
              />
            ) : (
              <div className="text-xs text-text-muted">Loading options...</div>
            )}
          </div>
        </div>
      ))}

      <div
        className="border-t mt-4 pt-3 flex items-center gap-3"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
      >
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white label px-3 py-1.5 text-xs rounded transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={cancelEdit}
          disabled={saving}
          className="label px-3 py-1.5 text-text-muted text-xs hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
