import { ClientTier, TIER_LABELS } from '@/lib/types'

const TIER_COLORS: Record<ClientTier, { bg: string; text: string }> = {
  rainbow: { bg: 'bg-grey-light', text: 'text-ink/60' },
  optimisto: { bg: 'bg-blue-100', text: 'text-blue-800' },
  kaizen: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  idealiste: { bg: 'bg-purple-100', text: 'text-purple-800' },
  diplomatico: { bg: 'bg-amber-100', text: 'text-amber-800' },
  grand_prix: { bg: 'bg-gold/20', text: 'text-gold' },
}

interface TierBadgeProps {
  tier: ClientTier
  size?: 'sm' | 'md'
}

export function TierBadge({ tier, size = 'sm' }: TierBadgeProps) {
  const colors = TIER_COLORS[tier]
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-3 py-1 text-xs'

  return (
    <span
      className={`
        inline-block font-sans font-medium uppercase tracking-wider
        ${colors.bg} ${colors.text} ${sizeClasses}
      `}
    >
      {TIER_LABELS[tier]}
    </span>
  )
}
