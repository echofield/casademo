'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SingleChipSelector } from '@/components/ChipSelector'
import type {
  BrandAffinity,
  BrandFamiliarity,
  BrandSensitivity,
  PurchaseBehavior,
  ContactPreference,
  BrandChannel,
  FashionInterestLevel,
} from '@/lib/types'
import {
  BRAND_FAMILIARITY_OPTIONS,
  SENSITIVITY_OPTIONS,
  PURCHASE_BEHAVIOR_OPTIONS,
  CONTACT_PREFERENCE_OPTIONS,
  CHANNEL_OPTIONS,
  FASHION_INTEREST_LEVELS,
} from '@/lib/types'

interface Props {
  clientId: string
  initialAffinity: BrandAffinity | null
  initialFashionInterest: FashionInterestLevel | null
  canEdit: boolean
}

const FIELDS = [
  { key: 'familiarity', label: 'Familiarity', options: BRAND_FAMILIARITY_OPTIONS },
  { key: 'purchase_behavior', label: 'Behavior', options: PURCHASE_BEHAVIOR_OPTIONS },
  { key: 'sensitivity', label: 'Sensitivity', options: SENSITIVITY_OPTIONS },
  { key: 'contact_preference', label: 'Contact', options: CONTACT_PREFERENCE_OPTIONS },
  { key: 'channel', label: 'Channel', options: CHANNEL_OPTIONS },
] as const

type AffinityKey = (typeof FIELDS)[number]['key']

function lookupLabel(
  options: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  if (!value) return '—'
  return options.find((o) => o.value === value)?.label ?? value
}

export function BrandAffinityPanel({
  clientId,
  initialAffinity,
  initialFashionInterest,
  canEdit,
}: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [familiarity, setFamiliarity] = useState<BrandFamiliarity | null>(
    initialAffinity?.familiarity ?? null,
  )
  const [sensitivity, setSensitivity] = useState<BrandSensitivity | null>(
    initialAffinity?.sensitivity ?? null,
  )
  const [purchaseBehavior, setPurchaseBehavior] = useState<PurchaseBehavior | null>(
    initialAffinity?.purchase_behavior ?? null,
  )
  const [contactPreference, setContactPreference] = useState<ContactPreference | null>(
    initialAffinity?.contact_preference ?? null,
  )
  const [channel, setChannel] = useState<BrandChannel | null>(
    initialAffinity?.channel ?? null,
  )
  const [fashionInterest, setFashionInterest] = useState<FashionInterestLevel | null>(
    initialFashionInterest,
  )

  const stateMap: Record<AffinityKey, string | null> = {
    familiarity,
    sensitivity,
    purchase_behavior: purchaseBehavior,
    contact_preference: contactPreference,
    channel,
  }

  const setterMap: Record<AffinityKey, (v: string | null) => void> = {
    familiarity: (v) => setFamiliarity(v as BrandFamiliarity | null),
    sensitivity: (v) => setSensitivity(v as BrandSensitivity | null),
    purchase_behavior: (v) => setPurchaseBehavior(v as PurchaseBehavior | null),
    contact_preference: (v) => setContactPreference(v as ContactPreference | null),
    channel: (v) => setChannel(v as BrandChannel | null),
  }

  const hasAnyValue =
    familiarity || sensitivity || purchaseBehavior || contactPreference || channel || fashionInterest

  function resetToInitial() {
    setFamiliarity(initialAffinity?.familiarity ?? null)
    setSensitivity(initialAffinity?.sensitivity ?? null)
    setPurchaseBehavior(initialAffinity?.purchase_behavior ?? null)
    setContactPreference(initialAffinity?.contact_preference ?? null)
    setChannel(initialAffinity?.channel ?? null)
    setFashionInterest(initialFashionInterest)
  }

  function handleCancel() {
    resetToInitial()
    setEditing(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const [affinityRes, fashionRes] = await Promise.all([
        fetch(`/api/clients/${clientId}/brand-affinity`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            familiarity,
            sensitivity,
            purchase_behavior: purchaseBehavior,
            contact_preference: contactPreference,
            channel,
          }),
        }),
        fetch(`/api/clients/${clientId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interest_in_fashion: fashionInterest }),
        }),
      ])

      if (!affinityRes.ok || !fashionRes.ok) {
        throw new Error('Save failed')
      }

      router.refresh()
      setEditing(false)
    } catch {
      alert('Failed to save brand affinity. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    const isEmpty = !hasAnyValue
    return (
      <div>
        {isEmpty ? (
          <p className="body-small text-text-muted">Not assessed yet</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            {FIELDS.map((f) => {
              const val = stateMap[f.key]
              if (!val) return null
              return (
                <div key={f.key}>
                  <p className="label text-text-muted">{f.label}</p>
                  <p className="body-small font-medium">{lookupLabel(f.options, val)}</p>
                </div>
              )
            })}
            {fashionInterest && (
              <div>
                <p className="label text-text-muted">Fashion signal</p>
                <p className="body-small font-medium">
                  {lookupLabel(FASHION_INTEREST_LEVELS, fashionInterest)}
                </p>
              </div>
            )}
          </div>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="label mt-4 text-xs text-primary hover:text-primary-soft"
          >
            Edit
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <p className="label mb-1.5 text-text-muted">{f.label}</p>
          <SingleChipSelector
            options={f.options as { value: string; label: string }[]}
            value={stateMap[f.key]}
            onChange={setterMap[f.key]}
          />
        </div>
      ))}
      <div>
        <p className="label mb-1.5 text-text-muted">Fashion signal</p>
        <SingleChipSelector
          options={FASHION_INTEREST_LEVELS as { value: string; label: string }[]}
          value={fashionInterest}
          onChange={(v) => setFashionInterest(v as FashionInterestLevel | null)}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="bg-primary text-white label px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={handleCancel}
          className="label px-3 py-1.5 text-text-muted text-xs hover:text-text disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
