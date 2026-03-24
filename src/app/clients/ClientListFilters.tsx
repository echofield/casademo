'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ClientTier, ClientSignal, SIGNAL_CONFIG, SIGNAL_ORDER } from '@/lib/types'
import { SignalDiamond } from '@/components'

type SortOption = 'alpha' | 'alpha_desc' | 'spend' | 'spend_desc' | 'last_contact' | 'tier' | 'tier_group'

const SORT_LABELS: Record<SortOption, string> = {
  alpha: 'Name A→Z',
  alpha_desc: 'Name Z→A',
  spend: 'Spend ↑',
  spend_desc: 'Spend ↓',
  last_contact: 'Last contact',
  tier: 'Tier',
  tier_group: 'By tier',
}

interface InterestValue {
  category: string
  value: string
  displayLabel: string
  domain: string
}

interface Props {
  currentSearch: string
  currentTier?: ClientTier
  currentSeller?: string
  currentSort?: string
  currentInterest?: string // Legacy category filter
  currentInterestVal?: string // New value-level filter
  currentSignal?: ClientSignal | 'null'
  currentLocale?: string
  tiers: ClientTier[]
  tierLabels: Record<ClientTier, string>
  sellers?: { id: string; full_name: string }[]
  interests?: string[] // Legacy: categories
  interestValues?: InterestValue[] // New: full taxonomy
  isSupervisor?: boolean
}

export function ClientListFilters({
  currentSearch,
  currentTier,
  currentSeller,
  currentSort = 'alpha',
  currentInterest,
  currentInterestVal,
  currentSignal,
  currentLocale,
  tiers,
  tierLabels,
  sellers = [],
  interests = [],
  interestValues = [],
  isSupervisor = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch)

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    params.delete('page')
    startTransition(() => {
      router.push(`/clients?${params.toString()}`)
    })
  }

  const updateParam = (key: string, value: string | undefined) => {
    updateParams({ [key]: value })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('search', search || undefined)
  }

  // Group interests by domain then category
  const fashionValues = interestValues.filter(iv => iv.domain === 'fashion')
  const lifeValues = interestValues.filter(iv => iv.domain === 'life')

  const groupByCategory = (items: InterestValue[]) => {
    return items.reduce((acc, iv) => {
      if (!acc[iv.category]) acc[iv.category] = []
      acc[iv.category].push(iv)
      return acc
    }, {} as Record<string, InterestValue[]>)
  }

  const fashionGrouped = groupByCategory(fashionValues)
  const lifeGrouped = groupByCategory(lifeValues)

  // Use value-level interest if available, otherwise fall back to category
  const effectiveInterestFilter = currentInterestVal || currentInterest

  const hasFilters = currentSearch || currentTier || currentSeller ||
    currentSort !== 'alpha' || effectiveInterestFilter || currentSignal || currentLocale

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6 flex-wrap">
      <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field pr-12"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            disabled={isPending}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      <select
        value={currentTier || ''}
        onChange={(e) => updateParam('tier', e.target.value || undefined)}
        className="input-field md:w-40"
      >
        <option value="">All tiers</option>
        {tiers.map((tier) => (
          <option key={tier} value={tier}>
            {tierLabels[tier]}
          </option>
        ))}
      </select>

      {/* Signal filter */}
      <select
        value={currentSignal || ''}
        onChange={(e) => updateParam('signal', e.target.value || undefined)}
        className="input-field md:w-36"
      >
        <option value="">All signals</option>
        {SIGNAL_ORDER.map((signal) => (
          <option key={signal} value={signal}>
            {SIGNAL_CONFIG[signal].label}
          </option>
        ))}
        <option value="null">Not assessed</option>
      </select>

      {/* Locale filter */}
      <select
        value={currentLocale || ''}
        onChange={(e) => updateParam('locale', e.target.value || undefined)}
        className="input-field md:w-32"
      >
        <option value="">All clients</option>
        <option value="local">Local</option>
        <option value="foreign">Foreign</option>
      </select>

      {/* Interest filter - value level with grouped options */}
      {(interestValues.length > 0 || interests.length > 0) && (
        <select
          value={effectiveInterestFilter || ''}
          onChange={(e) => {
            // Clear both params then set the appropriate one
            const value = e.target.value
            if (!value) {
              updateParams({ interest: undefined, interest_val: undefined })
            } else {
              updateParams({ interest: undefined, interest_val: value })
            }
          }}
          className="input-field md:w-44"
        >
          <option value="">All interests</option>
          {interestValues.length > 0 ? (
            <>
              {Object.keys(fashionGrouped).length > 0 && (
                <optgroup label="── Fashion ──">
                  {Object.entries(fashionGrouped).map(([cat, items]) => (
                    items.map((iv) => (
                      <option key={`f-${iv.value}`} value={iv.value}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}: {iv.displayLabel}
                      </option>
                    ))
                  )).flat()}
                </optgroup>
              )}
              {Object.keys(lifeGrouped).length > 0 && (
                <optgroup label="── Life ──">
                  {Object.entries(lifeGrouped).map(([cat, items]) => (
                    items.map((iv) => (
                      <option key={`l-${iv.value}`} value={iv.value}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}: {iv.displayLabel}
                      </option>
                    ))
                  )).flat()}
                </optgroup>
              )}
            </>
          ) : (
            interests.map((interest) => (
              <option key={interest} value={interest}>
                {interest.charAt(0).toUpperCase() + interest.slice(1)}
              </option>
            ))
          )}
        </select>
      )}

      <select
        value={currentSort}
        onChange={(e) => updateParam('sort', e.target.value === 'alpha' ? undefined : e.target.value)}
        className="input-field md:w-36"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
          <option key={opt} value={opt}>
            {SORT_LABELS[opt]}
          </option>
        ))}
      </select>

      {isSupervisor && sellers.length > 0 && (
        <select
          value={currentSeller || ''}
          onChange={(e) => updateParam('seller', e.target.value || undefined)}
          className="input-field md:w-44"
        >
          <option value="">All sellers</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={() => {
            setSearch('')
            router.push('/clients')
          }}
          className="btn-secondary px-4"
        >
          Reset
        </button>
      )}
    </div>
  )
}
