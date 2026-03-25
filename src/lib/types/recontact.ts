// ═══════════════════════════════════════════════════════════════
// CASA ONE — Recontact Cadence System
// Signal-aware multi-touch cadence with French/Foreign differentiation
// ═══════════════════════════════════════════════════════════════

import { ClientTier } from './index'

/**
 * Recontact cadence by signal level
 * Each array represents the day sequence for touches
 * French clients are local (Paris), Foreign clients are international
 */
export const RECONTACT_CADENCE = {
  very_hot: { french: [2, 5, 10], foreign: [1, 3, 7], label: 'Closing mode' },
  hot:      { french: [4, 8],     foreign: [2, 5, 10], label: 'Active follow-up' },
  warm:     { french: [7, 14],    foreign: [3, 7, 14], label: 'Gentle nudge' },
  cold:     { french: [18, 30],   foreign: [7, 21],    label: 'Light touch' },
  lost:     { french: [],         foreign: [],          label: 'No recontact' },
} as const

export type SignalCadence = typeof RECONTACT_CADENCE

/**
 * Recommended contact channel by tier
 * High-value clients get personal touch, others get WhatsApp
 */
export const CHANNEL_HINT: Record<ClientTier, string> = {
  grand_prix: 'Call or in-person',
  diplomatico: 'Call or in-person',
  idealiste: 'WhatsApp',
  kaizen: 'WhatsApp',
  optimisto: 'WhatsApp',
  rainbow: 'WhatsApp',
}

/**
 * Get a human-readable cadence label
 * Shows the day sequence like "Day 2 → Day 5 → Day 10 (French)"
 */
export function getCadenceLabel(signal: string | null, isForeign: boolean): string {
  if (!signal) return 'Assess signal first'
  if (signal === 'lost') return 'No recontact'

  const c = RECONTACT_CADENCE[signal as keyof typeof RECONTACT_CADENCE]
  if (!c) return 'Standard cadence'

  const days = isForeign ? c.foreign : c.french
  if (days.length === 0) return 'No recontact'

  return 'Day ' + days.join(' → Day ') + (isForeign ? ' (Foreign)' : ' (French)')
}

/**
 * Get the mode label for a signal
 */
export function getCadenceModeLabel(signal: string | null): string {
  if (!signal) return 'Not assessed'
  const c = RECONTACT_CADENCE[signal as keyof typeof RECONTACT_CADENCE]
  return c?.label || 'Standard'
}

/**
 * Get channel hint for a tier
 */
export function getChannelHint(tier: ClientTier): string {
  return CHANNEL_HINT[tier] || 'WhatsApp'
}
