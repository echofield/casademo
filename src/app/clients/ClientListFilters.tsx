'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ClientTier } from '@/lib/types'

type SortOption = 'alpha' | 'alpha_desc' | 'spend' | 'spend_desc'

interface Props {
  currentSearch: string
  currentTier?: ClientTier
  currentSort?: string
  tiers: ClientTier[]
  tierLabels: Record<ClientTier, string>
}

export function ClientListFilters({
  currentSearch,
  currentTier,
  currentSort = 'alpha',
  tiers,
  tierLabels,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch)

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => {
      router.push(`/clients?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParam('search', search || undefined)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full h-12 px-4 pr-12 bg-white border text-base text-text placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 transition-colors"
            style={{ borderColor: 'rgba(28, 27, 25, 0.12)' }}
          />
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            disabled={isPending}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Tier dropdown */}
      <div className="relative sm:w-44">
        <select
          value={currentTier || ''}
          onChange={(e) => updateParam('tier', e.target.value || undefined)}
          className="w-full h-12 px-4 pr-10 bg-white border text-base text-text appearance-none cursor-pointer focus:outline-none focus:border-primary/40 transition-colors"
          style={{ borderColor: 'rgba(28, 27, 25, 0.12)' }}
        >
          <option value="">All Tiers</option>
          {tiers.map((tier) => (
            <option key={tier} value={tier}>
              {tierLabels[tier]}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
