import type { MissedOpportunity } from '@/lib/demo/presentation-data'
import type { Client360, ClientTier } from '@/lib/types'
import type { ActivationMoment } from './activationMoments'
import type { PieceMatch } from './pieces'

export type OpportunityMetrics = {
  valueAtStakeEur: number
  openCount: number
  missedCount: number
  activeMomentsCount: number
}

const EUR_PREFIX_PATTERN = /(?:EUR|€)\s*([\d][\d.,\u00a0\s]*)/i
const EUR_SUFFIX_PATTERN = /([\d][\d.,\u00a0\s]*)\s*(?:EUR|€)/i

function parseEuroNumber(raw: string): number {
  const hasComma = raw.includes(',')
  const hasDot = raw.includes('.')
  // Treat a single comma as decimal separator only when there is no dot and exactly two digits follow.
  let normalised: string
  if (hasComma && !hasDot && /,\d{1,2}$/.test(raw.replace(/[\u00a0\s]/g, ''))) {
    normalised = raw.replace(/[\u00a0\s]/g, '').replace(/,/g, '.')
  } else {
    normalised = raw.replace(/[\u00a0\s]/g, '').replace(/[.,]/g, '')
  }
  const n = parseFloat(normalised)
  return Number.isFinite(n) ? Math.round(n) : 0
}

/**
 * Best-effort extraction of a numeric EUR value from free-text impact/description.
 * Handles both "€540" / "EUR 540" prefixes and "540 €" / "2,400 EUR" suffixes.
 * Returns 0 if nothing parseable is found.
 */
export function extractEurFromImpact(text: string | null | undefined): number {
  if (!text) return 0
  const prefix = EUR_PREFIX_PATTERN.exec(text)
  if (prefix) return parseEuroNumber(prefix[1])
  const suffix = EUR_SUFFIX_PATTERN.exec(text)
  if (suffix) return parseEuroNumber(suffix[1])
  return 0
}

export function sumMomentMidpoints(moments: ActivationMoment[]): number {
  return moments.reduce(
    (sum, m) => sum + Math.round((m.estimatedPotentialEur.min + m.estimatedPotentialEur.max) / 2),
    0,
  )
}

export function sumMissedImpacts(missed: MissedOpportunity[]): number {
  return missed
    .filter((m) => m.result === 'Missed')
    .reduce((sum, m) => sum + extractEurFromImpact(m.impact), 0)
}

export function computeMetrics(
  missed: MissedOpportunity[],
  moments: ActivationMoment[],
  highPriorityClientsCount: number,
): OpportunityMetrics {
  const valueAtStakeEur = sumMomentMidpoints(moments) + sumMissedImpacts(missed)
  const missedOpenCount = missed.filter((m) => m.result === 'Missed').length
  return {
    valueAtStakeEur,
    openCount: moments.length + highPriorityClientsCount,
    missedCount: missedOpenCount,
    activeMomentsCount: moments.length,
  }
}

const TIER_PRIORITY: Record<ClientTier, number> = {
  rainbow: 5,
  diplomatico: 4,
  grand_prix: 3,
  optimisto: 2,
  kaizen: 1,
  idealiste: 0,
}

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 9999
  const then = new Date(dateStr).getTime()
  if (Number.isNaN(then)) return 9999
  const now = Date.now()
  return Math.floor((now - then) / (1000 * 60 * 60 * 24))
}

export type DormantVip = {
  id: string
  first_name: string
  last_name: string
  tier: ClientTier
  daysSinceLastContact: number
  seller_signal: Client360['seller_signal']
}

/**
 * Top dormant VIPs to reactivate.
 * Ranking: tier priority first, then days since last contact (longer = more dormant), then heat_score.
 * Excludes 'lost' signals. Only surfaces higher tiers to keep the section quiet.
 */
export function topClientsToReactivate(
  clients: Client360[],
  limit = 3,
): DormantVip[] {
  return clients
    .filter((c) => c.seller_signal !== 'lost')
    .filter((c) => (TIER_PRIORITY[c.tier] ?? 0) >= TIER_PRIORITY.kaizen)
    .map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      tier: c.tier,
      daysSinceLastContact: daysSince(c.last_contact_date),
      seller_signal: c.seller_signal,
      _rank: TIER_PRIORITY[c.tier] ?? 0,
      _heat: c.heat_score ?? 0,
    }))
    .sort((a, b) => {
      if (b._rank !== a._rank) return b._rank - a._rank
      if (b.daysSinceLastContact !== a.daysSinceLastContact) return b.daysSinceLastContact - a.daysSinceLastContact
      return b._heat - a._heat
    })
    .slice(0, limit)
    .map(({ _rank, _heat, ...rest }) => rest)
}

export type SellerFollowUp = {
  seller_id: string
  seller_name: string
  missedCount: number
}

/**
 * Sellers with more than one missed opportunity in the last 30 days.
 * Ranked by missed count desc.
 */
export function sellersNeedingFollowUp(missed: MissedOpportunity[]): SellerFollowUp[] {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
  const byKey = new Map<string, SellerFollowUp>()
  for (const m of missed) {
    if (m.result !== 'Missed') continue
    const at = new Date(m.date).getTime()
    if (Number.isNaN(at) || at < cutoff) continue
    const key = m.seller_id ?? m.seller_name
    const prev = byKey.get(key)
    if (prev) {
      prev.missedCount += 1
    } else {
      byKey.set(key, {
        seller_id: m.seller_id ?? '',
        seller_name: m.seller_name,
        missedCount: 1,
      })
    }
  }
  return Array.from(byKey.values())
    .filter((s) => s.missedCount > 1)
    .sort((a, b) => b.missedCount - a.missedCount)
}

export function reportedThisWeek(missed: MissedOpportunity[]): MissedOpportunity[] {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  return missed.filter((m) => {
    const at = new Date(m.date).getTime()
    return !Number.isNaN(at) && at >= cutoff
  })
}

export function formatEur(n: number): string {
  if (n >= 1000) {
    return `€${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)}`
  }
  return `€${n}`
}

export function formatEurRange(range: { min: number; max: number }): string {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
  return `€${fmt(range.min)}\u2013€${fmt(range.max)}`
}

/**
 * Resolve each piece's paired clientId into a Client360 record from the demo roster.
 * Returns a Map keyed by piece id. Pieces with a missing client are omitted.
 */
export function resolvePieceClient(
  pieces: PieceMatch[],
  clients: Client360[],
): Map<string, Client360> {
  const byId = new Map<string, Client360>()
  for (const c of clients) byId.set(c.id, c)

  const out = new Map<string, Client360>()
  for (const p of pieces) {
    const c = byId.get(p.pairing.clientId)
    if (c) out.set(p.id, c)
  }
  return out
}

/**
 * Resolve each moment's `pairing.clientIds` into full Client360 records from the demo roster.
 * Acquisition moments resolve to an empty array (no specific client).
 * Missing ids are silently skipped.
 */
export function resolveMomentClients(
  moments: ActivationMoment[],
  clients: Client360[],
): Map<string, Client360[]> {
  const map = new Map<string, Client360>()
  for (const c of clients) map.set(c.id, c)

  const resolved = new Map<string, Client360[]>()
  for (const m of moments) {
    if (m.pairing.type === 'existing') {
      const list: Client360[] = []
      for (const id of m.pairing.clientIds) {
        const c = map.get(id)
        if (c) list.push(c)
      }
      resolved.set(m.id, list)
    } else {
      resolved.set(m.id, [])
    }
  }
  return resolved
}
