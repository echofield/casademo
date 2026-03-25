'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChipSelector } from '@/components/ChipSelector'
import { InterestTag } from '@/components/InterestTag'
import { LIFESTYLE_CATEGORIES } from '@/lib/types'
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function groupByCategory(items: InterestItem[]): Record<string, InterestItem[]> {
  const groups: Record<string, InterestItem[]> = {}
  for (const item of items) {
    const cat = item.category.toLowerCase()
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
}

export function LifestyleInterestsPanel({ clientId, interests, canEdit }: Props) {
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>(LIFESTYLE_CATEGORIES[0])
  const [newSelections, setNewSelections] = useState<Record<string, string[]>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([])
  const [taxonomyLoaded, setTaxonomyLoaded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (!editing || taxonomyLoaded) return
    fetch('/api/taxonomy?domain=life')
      .then((r) => r.json())
      .then((data: TaxonomyItem[]) => {
        setTaxonomy(data)
        setTaxonomyLoaded(true)
      })
      .catch(() => setTaxonomyLoaded(true))
  }, [editing, taxonomyLoaded])

  const grouped = groupByCategory(interests)

  const existingCountByCategory = (cat: string): number => {
    return (grouped[cat.toLowerCase()] || []).length
  }

  const newCountByCategory = (cat: string): number => {
    return (newSelections[cat] || []).length
  }

  const totalCountByCategory = (cat: string): number => {
    return existingCountByCategory(cat) + newCountByCategory(cat)
  }

  const totalNewCount = Object.values(newSelections).reduce(
    (sum, vals) => sum + vals.length,
    0,
  )

  const taxonomyForCategory = taxonomy.filter(
    (t) => t.category.toLowerCase() === activeCategory.toLowerCase(),
  )

  const existingValuesForCategory = new Set(
    (grouped[activeCategory.toLowerCase()] || []).map((i) => i.value),
  )

  const chipOptions = taxonomyForCategory
    .filter((t) => !existingValuesForCategory.has(t.value))
    .map((t) => ({ value: t.value, label: t.display_label }))

  const handleDelete = async (interestId: string) => {
    setDeleting(interestId)
    try {
      const res = await fetch(
        `/api/clients/${clientId}/interests/${interestId}`,
        { method: 'DELETE' },
      )
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const handleSave = async () => {
    const payload: { category: string; value: string; domain: string; detail?: string }[] = []

    for (const [cat, values] of Object.entries(newSelections)) {
      const note = notes[cat]?.trim() || null
      for (const value of values) {
        payload.push({
          category: cat,
          value,
          domain: 'life',
          ...(note ? { detail: note } : {}),
        })
      }
    }

    if (payload.length === 0) {
      exitEdit()
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/interests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: payload }),
      })
      if (res.ok) {
        router.refresh()
        exitEdit()
      }
    } finally {
      setSaving(false)
    }
  }

  const exitEdit = () => {
    setEditing(false)
    setNewSelections({})
    setNotes({})
    setActiveCategory(LIFESTYLE_CATEGORIES[0])
  }

  // ── Read mode ──────────────────────────────────────────────

  if (!editing) {
    const hasInterests = interests.length > 0

    return (
      <div className="space-y-4">
        {hasInterests ? (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="flex flex-wrap items-center gap-2">
              <span className="label text-text-muted shrink-0">{capitalize(cat)}</span>
              {items.map((interest) => (
                <span key={interest.id} className="inline-flex items-center gap-1">
                  <InterestTag
                    category={interest.category}
                    value={interest.value}
                    detail={interest.detail}
                    domain="life"
                    clickable={true}
                    size="md"
                  />
                  {canEdit && (
                    <>
                      {confirmDelete === interest.id ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="text-text-muted">Remove?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(interest.id)}
                            disabled={deleting === interest.id}
                            className="font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="text-text-muted hover:text-text"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(interest.id)}
                          className="flex h-4 w-4 items-center justify-center rounded-full text-text-muted/60 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remove ${interest.value}`}
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </span>
              ))}
            </div>
          ))
        ) : (
          <p className="body-small text-text-muted">No personal interests recorded.</p>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="label text-xs text-primary hover:text-primary-soft transition-colors"
          >
            Edit interests
          </button>
        )}
      </div>
    )
  }

  // ── Edit mode ──────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Category selector */}
      <div>
        <p className="label mb-2 text-text-muted">Category</p>
        <div className="flex flex-wrap gap-1.5">
          {LIFESTYLE_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat
            const count = totalCountByCategory(cat)

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`
                  inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150
                  ${
                    isActive
                      ? 'bg-[#003D2B]/10 text-[#003D2B] border-[#003D2B]/30'
                      : 'bg-transparent text-text border-text/20 hover:border-text/40'
                  }
                `}
              >
                {capitalize(cat)}
                {count > 0 && (
                  <span
                    className={`inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none ${
                      isActive
                        ? 'bg-[#003D2B] text-white'
                        : 'bg-text/10 text-text-muted'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Already existing interests in this category */}
      {(grouped[activeCategory.toLowerCase()] || []).length > 0 && (
        <div>
          <p className="label mb-1.5 text-text-muted">Current</p>
          <div className="flex flex-wrap gap-1.5">
            {(grouped[activeCategory.toLowerCase()] || []).map((interest) => (
              <InterestTag
                key={interest.id}
                category={interest.category}
                value={interest.value}
                detail={interest.detail}
                domain="life"
                clickable={false}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Taxonomy chips for selection */}
      <div>
        <p className="label mb-1.5 text-text-muted">Add new</p>
        {!taxonomyLoaded ? (
          <p className="body-small text-text-muted animate-pulse">Loading options...</p>
        ) : (
          <ChipSelector
            options={chipOptions}
            selected={newSelections[activeCategory] || []}
            onChange={(vals) =>
              setNewSelections((prev) => ({ ...prev, [activeCategory]: vals }))
            }
            allowCustom
            searchable={chipOptions.length > 8}
            placeholder={`Search ${activeCategory}...`}
          />
        )}
      </div>

      {/* Optional detail note */}
      <div>
        <input
          type="text"
          value={notes[activeCategory] || ''}
          onChange={(e) =>
            setNotes((prev) => ({ ...prev, [activeCategory]: e.target.value }))
          }
          placeholder="Add a note (optional)..."
          className="input-field w-full text-sm"
        />
      </div>

      {/* Save / Cancel actions */}
      <div
        className="flex items-center gap-3 border-t pt-4"
        style={{ borderColor: 'rgba(28, 27, 25, 0.08)' }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white label px-3 py-1.5 text-xs transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving…' : `Save${totalNewCount > 0 ? ` (${totalNewCount} new)` : ''}`}
        </button>
        <button
          type="button"
          onClick={exitEdit}
          disabled={saving}
          className="label px-3 py-1.5 text-text-muted text-xs hover:text-text transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
