'use client'

interface PersonalShopperBadgeProps {
  isPersonalShopper: boolean
  size?: 'sm' | 'md'
}

export function PersonalShopperBadge({ isPersonalShopper, size = 'sm' }: PersonalShopperBadgeProps) {
  if (!isPersonalShopper) return null

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium uppercase tracking-wide ${sizeClasses[size]}`}
      style={{
        backgroundColor: 'rgba(163, 135, 103, 0.15)',
        color: 'var(--gold)',
        borderRadius: '2px',
        border: '0.5px solid var(--gold)',
      }}
    >
      Personal Shopper
    </span>
  )
}
