import type { SupabaseClient } from '@supabase/supabase-js'
import type { ClientTier } from '@/lib/types'
import { TIER_RECONTACT_DAYS } from '@/lib/types'

export const CASABLANCA_IMPORT_TAG = '[import:casablanca-cleanup]'
export const NO_CONTACT_TAG = '[no-contact]'

/** Redirect sellers who left to another seller (lowercase name → lowercase name) */
export const SELLER_REDIRECT: Record<string, string> = {
  'kevin pastrana': 'hasael moussa',
  'oriane adjourouvi': 'hasael moussa',
  'amadou diop': 'hasael moussa',
  'naima mastour': 'hasael moussa',
  'julane moussa': 'hasael moussa',  // Same person, name change
  'hasael moussa': 'hasael moussa',  // Ensure correct mapping
}

export type CsvRow = Record<string, string | undefined>

const VALID_TIERS: ClientTier[] = [
  'rainbow',
  'optimisto',
  'kaizen',
  'idealiste',
  'diplomatico',
  'grand_prix',
]

export const COLUMN_MAP: Record<string, string[]> = {
  first_name: ['prenom', 'first_name', 'firstname', 'prénom'],
  last_name: ['nom', 'last_name', 'lastname', 'name'],
  email: ['email', 'mail', 'e-mail'],
  phone: ['telephone', 'phone', 'tel', 'téléphone', 'mobile'],
  seller: ['vendeur', 'seller', 'sales_rep', 'commercial'],
  total_spend: ['total_achats', 'total_spend', 'total', 'montant'],
  tier: ['tier', 'niveau', 'segment'],
  purchase_history: ['purchase_history', 'historique_achats', 'purchases', 'lignes_achat'],
  first_contact_date: ['date_premier_contact', 'first_contact', 'premiere_date'],
  last_contact_date: ['date_dernier_contact', 'last_contact', 'derniere_date'],
  interests: ['interets', 'interests', 'intérêts', 'preferences'],
  notes: ['notes', 'commentaire', 'comment', 'remarques'],
}

export function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_')
}

export function findColumn(row: CsvRow, field: string): string | undefined {
  const aliases = COLUMN_MAP[field] || []
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (normalizeColumnName(key) === normalizeColumnName(alias)) {
        const v = row[key]
        return v === undefined ? undefined : String(v).trim() || undefined
      }
    }
  }
  for (const key of Object.keys(row)) {
    if (normalizeColumnName(key) === normalizeColumnName(field)) {
      const v = row[key]
      return v === undefined ? undefined : String(v).trim() || undefined
    }
  }
  return undefined
}

/** Casablanca cleanup uses #N/A, 0, empty for missing names */
export function normalizeNamePart(raw: string | undefined, fallback: string): string {
  if (raw === undefined || raw === null) return fallback
  const s = String(raw).trim()
  if (!s) return fallback
  const lower = s.toLowerCase()
  if (lower === '#n/a' || lower === 'n/a' || lower === 'na') return fallback
  if (s === '0') return fallback
  return s
}

export function parseTier(raw: string | undefined): ClientTier | null {
  if (!raw) return null
  const t = raw.trim().toLowerCase() as ClientTier
  return VALID_TIERS.includes(t) ? t : null
}

export function parseDate(raw: string | undefined): string | null {
  if (!raw) return null
  const date = new Date(raw)
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0]
  }
  const parts = raw.split(/[/\-.]/)
  if (parts.length === 3) {
    const [d, m, y] = parts
    const parsed = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  }
  return null
}

export function parseInterests(raw: string | undefined): Array<{ category: string; value: string }> {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      if (item.includes(':')) {
        const [category, value] = item.split(':').map((s) => s.trim())
        return { category, value }
      }
      return { category: 'fashion', value: item }
    })
}

export function addDaysIso(isoDate: string | null, days: number): string | null {
  if (!isoDate) return null
  const d = new Date(isoDate + 'T12:00:00Z')
  if (isNaN(d.getTime())) return null
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

export interface PreparedImportRow {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  sellerKey: string
  totalSpend: number
  tierHint: ClientTier | null
  first_contact_date: string | null
  last_contact_date: string | null
  next_recontact_date: string | null
  interests: Array<{ category: string; value: string }>
  notes: string | null
  purchaseDescription: string | null
}

export type PrepareRowResult =
  | { ok: true; rowNum: number; data: PreparedImportRow }
  | { ok: false; rowNum: number; message: string }

export function prepareRowFromCsv(row: CsvRow, rowNum: number): PrepareRowResult {
  const rawFirst = findColumn(row, 'first_name')
  const rawLast = findColumn(row, 'last_name')
  const emailRaw = findColumn(row, 'email')
  const phoneRaw = findColumn(row, 'phone')

  let first = normalizeNamePart(rawFirst, '')
  let last = normalizeNamePart(rawLast, '')

  if (!first && !last) {
    if (emailRaw) {
      const local = emailRaw.split('@')[0]?.replace(/[.+_]/g, ' ').trim() || 'Client'
      first = local.slice(0, 1).toUpperCase() + local.slice(1) || 'Unknown'
      last = '—'
    } else if (phoneRaw) {
      first = 'Client'
      last = phoneRaw.replace(/\D/g, '').slice(-4) || 'Unknown'
    } else {
      // Cleanup export: some rows have only seller + spend (no PII)
      first = 'Client'
      last = `#${rowNum}`
    }
  } else {
    if (!first) first = 'Unknown'
    if (!last) last = '—'
  }

  const sellerNameRaw = findColumn(row, 'seller')
  if (!sellerNameRaw) {
    return { ok: false, rowNum, message: 'Missing seller' }
  }

  // Apply seller redirect (e.g., Kevin → Hasael)
  const sellerNameLower = sellerNameRaw.trim().toLowerCase()
  const sellerName = SELLER_REDIRECT[sellerNameLower] || sellerNameRaw

  const totalSpendRaw = findColumn(row, 'total_spend')
  let totalSpend = 0
  if (totalSpendRaw) {
    const n = parseFloat(String(totalSpendRaw).replace(/[^0-9.,-]/g, '').replace(',', '.'))
    if (!isNaN(n)) totalSpend = n
  }

  const tierHint = parseTier(findColumn(row, 'tier'))
  const firstD = parseDate(findColumn(row, 'first_contact_date'))
  const lastD = parseDate(findColumn(row, 'last_contact_date'))
  const intervalDays = tierHint ? TIER_RECONTACT_DAYS[tierHint] : 45
  const nextR = addDaysIso(lastD, intervalDays)

  const userNotes = findColumn(row, 'notes')
  const tag = CASABLANCA_IMPORT_TAG
  const noContactTag = (!emailRaw && !phoneRaw) ? ` ${NO_CONTACT_TAG}` : ''
  const redirectTag = SELLER_REDIRECT[sellerNameLower] ? ` [ex:${sellerNameRaw}]` : ''
  const notes = userNotes
    ? `${tag}${noContactTag}${redirectTag} ${userNotes}`
    : `${tag}${noContactTag}${redirectTag}`

  const purchaseRaw = findColumn(row, 'purchase_history')
  const purchaseDescription = purchaseRaw
    ? purchaseRaw.slice(0, 12000)
    : null

  return {
    ok: true,
    rowNum,
    data: {
      first_name: first,
      last_name: last,
      email: emailRaw ? emailRaw.trim().toLowerCase() : null,
      phone: phoneRaw ? phoneRaw.trim() : null,
      sellerKey: sellerName.trim().toLowerCase(),
      totalSpend,
      tierHint,
      first_contact_date: firstD,
      last_contact_date: lastD,
      next_recontact_date: nextR,
      interests: parseInterests(findColumn(row, 'interests')),
      notes,
      purchaseDescription,
    },
  }
}

export async function clientExistsByEmailOrPhone(
  supabase: SupabaseClient,
  email: string | null,
  phone: string | null
): Promise<boolean> {
  if (email) {
    const { data } = await supabase.from('clients').select('id').eq('email', email).maybeSingle()
    if (data) return true
  }
  if (phone) {
    const { data } = await supabase.from('clients').select('id').eq('phone', phone).maybeSingle()
    if (data) return true
  }
  return false
}

export interface ImportCounters {
  created: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export async function importPreparedRow(
  supabase: SupabaseClient,
  sellerId: string,
  prepared: PreparedImportRow,
  rowNum: number,
  counters: ImportCounters
): Promise<void> {
  const exists = await clientExistsByEmailOrPhone(supabase, prepared.email, prepared.phone)
  if (exists) {
    counters.skipped++
    return
  }

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      first_name: prepared.first_name,
      last_name: prepared.last_name,
      email: prepared.email,
      phone: prepared.phone,
      seller_id: sellerId,
      first_contact_date: prepared.first_contact_date,
      last_contact_date: prepared.last_contact_date,
      next_recontact_date: prepared.next_recontact_date,
      notes: prepared.notes,
    })
    .select()
    .single()

  if (clientError || !client) {
    counters.errors.push({ row: rowNum, message: clientError?.message || 'Insert failed' })
    return
  }

  if (prepared.totalSpend > 0) {
    const purchaseDate =
      prepared.last_contact_date ||
      prepared.first_contact_date ||
      new Date().toISOString().split('T')[0]

    const { error: pErr } = await supabase.from('purchases').insert({
      client_id: client.id,
      seller_id: sellerId,
      amount: prepared.totalSpend,
      description:
        prepared.purchaseDescription?.trim() ||
        'Historical spend (imported)',
      purchase_date: purchaseDate,
    })

    if (pErr) {
      counters.errors.push({ row: rowNum, message: `Purchase: ${pErr.message}` })
      return
    }
  }

  if (prepared.interests.length > 0) {
    const { error: iErr } = await supabase.from('client_interests').insert(
      prepared.interests.map((i) => ({
        client_id: client.id,
        category: i.category,
        value: i.value,
      }))
    )
    if (iErr) {
      counters.errors.push({ row: rowNum, message: `Interests: ${iErr.message}` })
    }
  }

  counters.created++
}

/** Build seller map: lowercase full_name / email -> profile id */
export function profilesToSellerMap(
  sellers: Array<{ id: string; full_name: string; email: string }>
): Map<string, string> {
  const m = new Map<string, string>()
  for (const s of sellers) {
    m.set(s.full_name.trim().toLowerCase(), s.id)
    m.set(s.email.trim().toLowerCase(), s.id)
  }
  return m
}
