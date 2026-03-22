import { ClientTier, TIER_LABELS } from '@/lib/types'

// SYMI-style tier colors
const TIER_COLORS: Record<ClientTier, { text: string; border: string }> = {
  rainbow: { text: 'var(--ink-soft)', border: 'var(--faint)' },
  optimisto: { text: 'var(--ink-soft)', border: 'var(--warmgrey)' },
  kaizen: { text: 'var(--green)', border: 'var(--green)' },
  idealiste: { text: 'var(--green)', border: 'var(--green)' },
  diplomatico: { text: 'var(--gold)', border: 'var(--gold)' },
  grand_prix: { text: 'var(--gold)', border: 'var(--gold)' },
}

interface TierBadgeProps {
  tier: ClientTier | string
  size?: 'sm' | 'md'
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const tierKey = tier as ClientTier
  const colors = TIER_COLORS[tierKey] || { text: 'var(--ink-soft)', border: 'var(--faint)' }
  const label = TIER_LABELS[tierKey] || tier

  const sizeClasses = size === 'sm'
    ? 'text-[9px] px-2 py-0.5'
    : 'text-[10px] px-3 py-1'

  return (
    <span
      className={`
        inline-block font-sans font-medium uppercase tracking-[0.1em]
        ${sizeClasses}
      `}
      style={{
        color: colors.text,
        border: `0.5px solid ${colors.border}`,
        borderRadius: '2px',
      }}
    >
      {label}
    </span>
  )
}
