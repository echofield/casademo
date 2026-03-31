import { getSignalPriority } from '@/lib/types/signal'
import type { ClientSignal } from '@/lib/types'

export type QueueMode = 'all' | 'focus'
export type FocusSignalBucket = 'all' | 'locked' | 'strong' | 'other'
export type FocusValueFilter = 'all' | 'high_spend'
export type FocusContactFilter = 'phone_ready' | 'not_enough_info'

export const HIGH_SPEND_THRESHOLD = 10000

type FocusClient = {
  id: string
  seller_signal?: ClientSignal | null
  phone?: string | null
  total_spend: number
  days_overdue: number | null
  last_contact_date?: string | null
}

function getOverduePriority(daysOverdue: number | null): number {
  if (typeof daysOverdue !== 'number') return -9999
  return daysOverdue
}

function getLastContactPriority(lastContactDate?: string | null): number {
  if (!lastContactDate) return 0

  const timestamp = new Date(lastContactDate).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export function matchesFocusSignalBucket(
  signal: ClientSignal | null | undefined,
  bucket: FocusSignalBucket
): boolean {
  if (bucket === 'all') return true
  if (bucket === 'locked') return signal === 'very_hot'
  if (bucket === 'strong') return signal === 'hot'
  return signal !== 'very_hot' && signal !== 'hot'
}

export function matchesFocusValueFilter(
  totalSpend: number,
  valueFilter: FocusValueFilter
): boolean {
  if (valueFilter === 'all') return true
  return totalSpend >= HIGH_SPEND_THRESHOLD
}

export function hasUsablePhoneNumber(phone: string | null | undefined): boolean {
  if (!phone) return false
  const normalizedDigits = phone.replace(/\D/g, '')
  return normalizedDigits.length >= 6
}

export function matchesFocusContactFilter(
  phone: string | null | undefined,
  contactFilter: FocusContactFilter
): boolean {
  const phoneReady = hasUsablePhoneNumber(phone)
  return contactFilter === 'phone_ready' ? phoneReady : !phoneReady
}

export function sortClientsForFocus<T extends FocusClient>(clients: T[]): T[] {
  return [...clients].sort((a, b) => {
    const phoneReadyDelta = Number(hasUsablePhoneNumber(b.phone)) - Number(hasUsablePhoneNumber(a.phone))
    if (phoneReadyDelta !== 0) return phoneReadyDelta

    const signalDelta = getSignalPriority(a.seller_signal ?? null) - getSignalPriority(b.seller_signal ?? null)
    if (signalDelta !== 0) return signalDelta

    const overdueDelta = getOverduePriority(b.days_overdue) - getOverduePriority(a.days_overdue)
    if (overdueDelta !== 0) return overdueDelta

    const spendDelta = (b.total_spend || 0) - (a.total_spend || 0)
    if (spendDelta !== 0) return spendDelta

    const lastContactDelta = getLastContactPriority(a.last_contact_date) - getLastContactPriority(b.last_contact_date)
    if (lastContactDelta !== 0) return lastContactDelta

    return a.id.localeCompare(b.id)
  })
}