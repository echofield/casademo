import { ClientTier, TIER_LABELS } from '@/lib/types'

const TIER_STYLES: Record<ClientTier, string> = {
  rainbow: 'text-text-muted',
  optimisto: 'text-text-soft',
  kaizen: 'text-primary',
  idealiste: 'text-primary',
  diplomatico: 'text-gold',
  grand_prix: 'text-gold',
}

interface TierBadgeProps {
  tier: ClientTier | string
  size?: 'sm' | 'md'
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const tierKey = tier as ClientTier
  const style = TIER_STYLES[tierKey] || 'text-text-muted'
  const label = TIER_LABELS[tierKey] || tier

  const sizeClasses = size === 'sm'
    ? 'text-[10px] tracking-[0.1em]'
    : 'text-xs tracking-[0.08em]'

  return (
    <span
      className={`
        inline-block font-sans font-medium uppercase
        ${style} ${sizeClasses}
      `}
    >
      {label}
    </span>
  )
}
