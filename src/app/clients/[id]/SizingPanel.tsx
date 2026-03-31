'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SIZE_SYSTEM, getItemTypeLabel, getSizeValues, getSupportedSizeSystems } from '@/lib/config/sizeSystem'
import type { SizingItem, KnownSizeItem, SizeSystem } from '@/lib/types'

interface Props {
  clientId: string
  sizing: SizingItem[]
  knownSizes: KnownSizeItem[]
  canEdit: boolean
}

const cardBorder = { borderColor: 'rgba(28, 27, 25, 0.08)' }
const ITEM_TYPES = Object.keys(SIZE_SYSTEM)

export function SizingPanel({ clientId, sizing, knownSizes, canEdit }: Props) {
  const router = useRouter()

  const [adding, setAdding] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedSystem, setSelectedSystem] = useState<SizeSystem | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const derivedCategories = new Set(knownSizes.map((d) => d.category.toLowerCase()))
  const manualOnly = sizing.filter((s) => !derivedCategories.has(s.category.toLowerCase()))
  const manualCategories = new Set(sizing.map((s) => s.category.toLowerCase()))

  const config = selectedType ? SIZE_SYSTEM[selectedType] : null
  const supportedSystems = selectedType ? getSupportedSizeSystems(selectedType) : []
  const activeSystem = selectedSystem ?? config?.system ?? null
  const selectableSizes = selectedType && activeSystem ? getSizeValues(selectedType, activeSystem) : []

  const handleSave = async () => {
    if (!selectedType || !selectedSize || !config || !activeSystem) return

    setSaving(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/sizing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedType,
          size: selectedSize,
          size_system: activeSystem,
        }),
      })

      if (res.ok) {
        router.refresh()
        resetForm()
      } else {
        toast.error('Could not save size')
      }
    } catch {
      toast.error('Could not save size')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: string) => {
    setDeleting(category)
    try {
      const res = await fetch(
        `/api/clients/${clientId}/sizing?category=${encodeURIComponent(category)}`,
        { method: 'DELETE' },
      )
      if (res.ok) {
        router.refresh()
      } else {
        toast.error('Could not remove size')
      }
    } catch {
      toast.error('Could not remove size')
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const resetForm = () => {
    setAdding(false)
    setSelectedType(null)
    setSelectedSize(null)
    setSelectedSystem(null)
  }

  const hasAnySizing = knownSizes.length > 0 || manualOnly.length > 0

  return (
    <div>
      {hasAnySizing ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-xs text-text-muted" style={cardBorder}>
                <th className="pb-2 pr-4 font-medium">Item</th>
                <th className="pb-2 pr-4 font-medium">Size</th>
                <th className="pb-2 pr-4 font-medium">Source</th>
                {canEdit && <th className="w-16 pb-2 font-medium" />}
              </tr>
            </thead>
            <tbody className="body-small">
              {knownSizes.map((ks) => (
                <tr key={`derived-${ks.category}`} className="border-b last:border-0" style={cardBorder}>
                  <td className="py-2.5 pr-4 font-medium text-text">{getItemTypeLabel(ks.category)}</td>
                  <td className="py-2.5 pr-4 font-serif text-lg text-text">{ks.size}</td>
                  <td className="py-2.5 pr-4 text-text-muted">{ks.last_product || 'Purchase'}</td>
                  {canEdit && <td className="py-2.5" />}
                </tr>
              ))}
              {manualOnly.map((s) => (
                <tr key={`manual-${s.id}`} className="border-b last:border-0" style={cardBorder}>
                  <td className="py-2.5 pr-4 font-medium text-text">{getItemTypeLabel(s.category)}</td>
                  <td className="py-2.5 pr-4 font-serif text-lg text-text">
                    {s.size}
                    {s.size_system && (
                      <span className="ml-1.5 text-xs font-sans text-text-muted">({s.size_system})</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 italic text-text-muted">Manual</td>
                  {canEdit && (
                    <td className="py-2.5 text-right">
                      {confirmDelete === s.category ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <button
                            type="button"
                            onClick={() => handleDelete(s.category)}
                            disabled={deleting === s.category}
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
                          onClick={() => setConfirmDelete(s.category)}
                          className="text-text-muted/60 transition-colors hover:text-red-500"
                          aria-label={`Remove ${s.category} size`}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="body-small text-text-muted">No sizing data yet.</p>
      )}

      {canEdit && !adding && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="label mt-4 text-xs text-primary transition-colors hover:text-primary-soft"
        >
          + Add size
        </button>
      )}

      {canEdit && adding && (
        <div className="mt-4 space-y-4 border-t pt-4" style={cardBorder}>
          <div>
            <p className="label mb-2 text-text-muted">Item type</p>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_TYPES.map((type) => {
                const isSelected = selectedType === type
                const alreadyHas = derivedCategories.has(type) || manualCategories.has(type)
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={alreadyHas}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedType(null)
                        setSelectedSystem(null)
                        setSelectedSize(null)
                        return
                      }

                      const defaultSystem = SIZE_SYSTEM[type].system
                      setSelectedType(type)
                      setSelectedSystem(defaultSystem)
                      setSelectedSize(null)
                    }}
                    className={`
                      rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-150
                      ${alreadyHas
                        ? 'cursor-not-allowed border-text/10 text-text-muted opacity-30'
                        : isSelected
                          ? 'border-[#003D2B] bg-[#003D2B] text-white'
                          : 'border-text/20 bg-transparent text-text hover:border-text/40'
                      }
                    `}
                  >
                    {SIZE_SYSTEM[type].label}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedType && config && (
            <div className="space-y-3">
              {supportedSystems.length > 1 && (
                <div>
                  <p className="label mb-2 text-text-muted">Size system</p>
                  <div className="flex flex-wrap gap-1.5">
                    {supportedSystems.map((system) => {
                      const isSelected = activeSystem === system
                      return (
                        <button
                          key={system}
                          type="button"
                          onClick={() => {
                            setSelectedSystem(system)
                            setSelectedSize(null)
                          }}
                          className={`
                            rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150
                            ${isSelected
                              ? 'border-[#003D2B] bg-[#003D2B] text-white'
                              : 'border-text/20 bg-transparent text-text hover:border-text/40'
                            }
                          `}
                        >
                          {system}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="label mb-2 text-text-muted">
                  Size
                  {activeSystem && <span className="ml-1.5 font-normal text-text-muted/60">({activeSystem})</span>}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectableSizes.map((val) => {
                    const isSelected = selectedSize === val
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? null : val)}
                        className={`
                          min-w-[2.5rem] rounded-full border px-3 py-1.5 text-center text-sm font-medium transition-all duration-150
                          ${isSelected
                            ? 'border-[#003D2B] bg-[#003D2B] text-white'
                            : 'border-text/20 bg-transparent text-text hover:border-text/40'
                          }
                        `}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedType || !selectedSize || !activeSystem || saving}
              className="label bg-primary px-3 py-1.5 text-xs text-white disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="label px-3 py-1.5 text-xs text-text-muted hover:text-text"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
