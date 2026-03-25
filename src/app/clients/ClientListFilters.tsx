'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useRef, useCallback, useEffect } from 'react'
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
  const debounceRef = useRef<NodeJS.Timeout>()

  const updateParam = useCallback((key: string, value: string | undefined) => {
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
  }, [searchParams, router])

  // Debounced search - fires 300ms after user stops typing
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateParam('search', value || undefined)
    }, 300)
  }, [updateParam])

  // Clear debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    clearTimeout(debounceRef.current)
    updateParam('search', search || undefined)
  }

  const handleClearSearch = () => {
    setSearch('')
    clearTimeout(debounceRef.current)
    updateParam('search', undefined)
  }

  const handleSearchBlur = () => {
    // Fire search on blur if value changed
    if (search !== currentSearch) {
      clearTimeout(debounceRef.current)
      updateParam('search', search || undefined)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            onBlur={handleSearchBlur}
            placeholder="Search by name, email, or phone..."
            className="w-full h-12 px-4 pr-20 bg-white border text-base text-text placeholder:text-text-muted/60 focus:outline-none focus:border-primary/40 transition-colors"
            style={{ borderColor: 'rgba(28, 27, 25, 0.12)' }}
          />
          {/* Clear button */}
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors p-1"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Search/loading indicator */}
          <button
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
            disabled={isPending}
          >
            {isPending ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
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
