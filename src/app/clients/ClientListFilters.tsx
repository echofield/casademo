'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ClientTier } from '@/lib/types'

interface Props {
  currentSearch: string
  currentTier?: ClientTier
  currentSeller?: string
  tiers: ClientTier[]
  tierLabels: Record<ClientTier, string>
  sellers?: { id: string; full_name: string }[]
  isSupervisor?: boolean
}

export function ClientListFilters({
  currentSearch,
  currentTier,
  currentSeller,
  tiers,
  tierLabels,
  sellers = [],
  isSupervisor = false,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(currentSearch)

  const updateParams = (key: string, value: string | undefined) => {
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
    updateParams('search', search || undefined)
  }

  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      <form onSubmit={handleSearchSubmit} className="flex-1">
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
        onChange={(e) => updateParams('tier', e.target.value || undefined)}
        className="input-field md:w-48"
      >
        <option value="">Tous les paliers</option>
        {tiers.map((tier) => (
          <option key={tier} value={tier}>
            {tierLabels[tier]}
          </option>
        ))}
      </select>

      {isSupervisor && sellers.length > 0 && (
        <select
          value={currentSeller || ''}
          onChange={(e) => updateParams('seller', e.target.value || undefined)}
          className="input-field md:w-48"
        >
          <option value="">Tous les vendeurs</option>
          {sellers.map((seller) => (
            <option key={seller.id} value={seller.id}>
              {seller.full_name}
            </option>
          ))}
        </select>
      )}

      {(currentSearch || currentTier || currentSeller) && (
        <button
          onClick={() => {
            setSearch('')
            router.push('/clients')
          }}
          className="btn-secondary px-4"
        >
          Clear
        </button>
      )}
    </div>
  )
}
