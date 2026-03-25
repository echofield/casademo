'use client'

import Link from 'next/link'

const FASHION_COLOR = {
  bg: 'bg-[#003D2B]/[0.08]',
  text: 'text-[#003D2B]',
  hoverBg: 'hover:bg-[#003D2B]/[0.14]',
}

const PRODUCT_COLOR = FASHION_COLOR

const INTEREST_COLORS: Record<string, { bg: string; text: string; hoverBg: string }> = {
  // Product domain categories (formerly fashion) — all brand green
  product: PRODUCT_COLOR,
  products: PRODUCT_COLOR,
  collections: PRODUCT_COLOR,
  styles: PRODUCT_COLOR,
  colors: PRODUCT_COLOR,
  occasions: PRODUCT_COLOR,
  fit: PRODUCT_COLOR,
  materials: PRODUCT_COLOR,
  avoided: { bg: 'bg-red-50', text: 'text-red-700', hoverBg: 'hover:bg-red-100' },
  // Legacy alias
  fashion: FASHION_COLOR,
  // Life domain categories
  food: { bg: 'bg-amber-50', text: 'text-amber-700', hoverBg: 'hover:bg-amber-100' },
  art: { bg: 'bg-purple-50', text: 'text-purple-700', hoverBg: 'hover:bg-purple-100' },
  music: { bg: 'bg-rose-50', text: 'text-rose-700', hoverBg: 'hover:bg-rose-100' },
  sport: { bg: 'bg-green-50', text: 'text-green-700', hoverBg: 'hover:bg-green-100' },
  lifestyle: { bg: 'bg-sky-50', text: 'text-sky-700', hoverBg: 'hover:bg-sky-100' },
  culture: { bg: 'bg-indigo-50', text: 'text-indigo-700', hoverBg: 'hover:bg-indigo-100' },
  nightlife: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', hoverBg: 'hover:bg-fuchsia-100' },
  wellness: { bg: 'bg-teal-50', text: 'text-teal-700', hoverBg: 'hover:bg-teal-100' },
  technology: { bg: 'bg-slate-100', text: 'text-slate-700', hoverBg: 'hover:bg-slate-200' },
  cars: { bg: 'bg-zinc-100', text: 'text-zinc-700', hoverBg: 'hover:bg-zinc-200' },
  watches: { bg: 'bg-yellow-50', text: 'text-yellow-700', hoverBg: 'hover:bg-yellow-100' },
  books: { bg: 'bg-orange-50', text: 'text-orange-700', hoverBg: 'hover:bg-orange-100' },
  cinema: { bg: 'bg-violet-50', text: 'text-violet-700', hoverBg: 'hover:bg-violet-100' },
  business: { bg: 'bg-cyan-50', text: 'text-cyan-700', hoverBg: 'hover:bg-cyan-100' },
  travel: { bg: 'bg-emerald-50', text: 'text-emerald-700', hoverBg: 'hover:bg-emerald-100' },
  design: { bg: 'bg-pink-50', text: 'text-pink-700', hoverBg: 'hover:bg-pink-100' },
}

const DEFAULT_COLORS = {
  bg: 'bg-gray-50',
  text: 'text-gray-600',
  hoverBg: 'hover:bg-gray-100',
}

interface InterestTagProps {
  category: string
  value: string
  detail?: string | null
  domain?: 'product' | 'life' | 'fashion'
  clickable?: boolean
  size?: 'sm' | 'md'
  count?: number
}

export function InterestTag({
  category,
  value,
  domain,
  clickable = true,
  size = 'sm',
  count,
}: InterestTagProps) {
  const colors = INTEREST_COLORS[category.toLowerCase()] || DEFAULT_COLORS

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1'

  const baseClasses = `
    inline-flex items-center gap-1 rounded-full
    ${colors.bg} ${colors.text}
    ${sizeClasses}
    transition-colors duration-150
  `

  const displayValue = value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const content = (
    <>
      <span className="font-medium">{category}:</span>
      <span>{displayValue}</span>
      {count !== undefined && count > 0 && (
        <span className="opacity-60">({count})</span>
      )}
    </>
  )

  if (clickable) {
    const domainParam = domain ? `&domain=${domain}` : ''
    return (
      <Link
        href={`/clients?interest_val=${encodeURIComponent(value)}${domainParam}`}
        className={`${baseClasses} ${colors.hoverBg} cursor-pointer`}
      >
        {content}
      </Link>
    )
  }

  return (
    <span className={baseClasses}>
      {content}
    </span>
  )
}

export { INTEREST_COLORS }
