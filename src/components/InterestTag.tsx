'use client'

import Link from 'next/link'

const FASHION_COLOR = {
  bg: 'bg-[#003D2B]/[0.08]',
  text: 'text-[#003D2B]',
  hoverBg: 'hover:bg-[#003D2B]/[0.14]',
}

const INTEREST_COLORS: Record<string, { bg: string; text: string; hoverBg: string }> = {
  // Fashion domain categories all use the brand green
  fashion: FASHION_COLOR,
  products: FASHION_COLOR,
  collections: FASHION_COLOR,
  styles: FASHION_COLOR,
  colors: FASHION_COLOR,
  occasions: FASHION_COLOR,
  // Life domain categories
  food: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hoverBg: 'hover:bg-amber-100',
  },
  art: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    hoverBg: 'hover:bg-purple-100',
  },
  music: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    hoverBg: 'hover:bg-rose-100',
  },
  sport: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    hoverBg: 'hover:bg-green-100',
  },
  lifestyle: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    hoverBg: 'hover:bg-sky-100',
  },
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
  domain?: 'fashion' | 'life'
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
