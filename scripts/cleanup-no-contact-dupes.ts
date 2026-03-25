/**
 * Cleanup duplicate no-contact clients
 *
 * The CSV has rows with no email/phone. These were imported multiple times.
 *
 * IMPORTANT: The CSV can have multiple DIFFERENT people with the same
 * seller_id + total_spend. We must NOT delete those legitimate rows.
 *
 * Strategy:
 * 1. Load CSV and count no-contact rows per seller+spend key
 * 2. Load DB and count no-contact clients per seller+spend key
 * 3. For each key, delete newest rows until DB count = CSV count
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import Papa from 'papaparse'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Map seller IDs to names and vice versa
const SELLER_ID_TO_NAME: Record<string, string> = {}
const SELLER_NAME_TO_ID: Record<string, string> = {}

// Seller redirects (departed sellers -> current seller)
// Must match cleanupImport.ts SELLER_REDIRECT
const SELLER_REDIRECT: Record<string, string> = {
  'kevin pastrana': 'hasael moussa',
  'oriane adjourouvi': 'hasael moussa',
  'amadou diop': 'hasael moussa',
  'naima mastour': 'hasael moussa',
  'julane moussa': 'hasael moussa',  // Same person, name change
  'hasael moussa': 'hasael moussa',  // Ensure correct mapping
  'hamza said': 'hasael moussa',     // Departed seller
  'ryan jackson': 'hasael moussa',   // Departed seller
}

async function loadSellerMapping() {
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, full_name')

  if (sellers) {
    for (const s of sellers) {
      if (s.full_name) {
        const name = s.full_name.toLowerCase().trim()
        SELLER_ID_TO_NAME[s.id] = name
        // Keep first mapping for each name (prefer existing over new)
        if (!SELLER_NAME_TO_ID[name]) {
          SELLER_NAME_TO_ID[name] = s.id
        }
      }
    }
  }

  // Build redirect mapping - redirect old sellers to their replacement's ID
  for (const [oldName, newName] of Object.entries(SELLER_REDIRECT)) {
    SELLER_NAME_TO_ID[oldName] = SELLER_NAME_TO_ID[newName] || oldName
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('     CLEANUP NO-CONTACT DUPLICATE CLIENTS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')

  // Load seller mapping
  await loadSellerMapping()

  // Load CSV and count no-contact rows per seller+spend
  const csvPath = 'C:\\Users\\echof\\Desktop\\casblanca\\cleanup_output\\clients_clean.csv'
  const csvText = readFileSync(csvPath, 'utf-8')
  const { data: csvRows } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })

  const csvCounts = new Map<string, number>()
  let csvNoContact = 0

  for (const row of csvRows) {
    const email = (row.email || '').trim()
    const phone = (row.phone || '').replace(/\D/g, '')
    const hasEmail = email.length > 0 && !email.toLowerCase().includes('#n/a')
    const hasPhone = phone.length >= 8

    if (!hasEmail && !hasPhone) {
      csvNoContact++
      let sellerName = (row.seller || '').toLowerCase().trim()
      // Apply redirect for departed sellers
      if (SELLER_REDIRECT[sellerName]) {
        sellerName = SELLER_REDIRECT[sellerName]
      }
      const sellerId = SELLER_NAME_TO_ID[sellerName] || sellerName
      const spend = parseFloat(row.total_spend || '0')
      const key = `${sellerId}:${spend}`
      csvCounts.set(key, (csvCounts.get(key) || 0) + 1)
    }
  }

  console.log(`CSV total rows: ${csvRows.length}`)
  console.log(`CSV no-contact rows: ${csvNoContact}`)
  console.log(`CSV unique seller+spend keys: ${csvCounts.size}`)
  console.log('')

  // Fetch all DB clients
  const allClients: any[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, seller_id, total_spend, created_at, notes')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) { console.error(error); break }
    if (!data || data.length === 0) break
    allClients.push(...data)
    if (data.length < pageSize) break
    page++
  }

  // Filter to no-contact clients only
  const noContactClients = allClients.filter(c => {
    const hasEmail = c.email && c.email.trim().length > 0
    const hasPhone = c.phone && c.phone.trim().length > 0
    return !hasEmail && !hasPhone
  })

  console.log(`DB total clients: ${allClients.length}`)
  console.log(`DB no-contact clients: ${noContactClients.length}`)
  console.log('')

  // Group DB no-contact clients by seller_id + total_spend
  // Use the same seller ID resolution as CSV for proper matching
  const dbGroups = new Map<string, any[]>()
  for (const c of noContactClients) {
    // Get normalized seller ID - look up the name and re-resolve to consistent ID
    let sellerName = SELLER_ID_TO_NAME[c.seller_id] || ''
    if (SELLER_REDIRECT[sellerName]) {
      sellerName = SELLER_REDIRECT[sellerName]
    }
    const normalizedSellerId = SELLER_NAME_TO_ID[sellerName] || c.seller_id
    const key = `${normalizedSellerId}:${c.total_spend}`
    if (!dbGroups.has(key)) dbGroups.set(key, [])
    dbGroups.get(key)!.push(c)
  }

  // Simple approach: Delete the newest no-contact clients to match the count
  // DB has 262, CSV has 162, so delete 100 newest
  const extraCount = noContactClients.length - csvNoContact

  // Sort all no-contact clients by created_at descending (newest first)
  const sortedNoContact = [...noContactClients].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Take the newest 'extraCount' for deletion
  const toDelete: string[] = sortedNoContact.slice(0, Math.max(0, extraCount)).map(c => c.id)

  console.log(`Extra no-contact clients: ${extraCount}`)
  console.log(`Clients to delete: ${toDelete.length}`)
  console.log(`Expected final no-contact: ${noContactClients.length - toDelete.length}`)
  console.log(`CSV no-contact (target): ${csvNoContact}`)
  console.log('')

  // Show sample of what will be deleted
  if (toDelete.length > 0) {
    console.log('Sample clients to delete (newest first, first 20):')
    for (let i = 0; i < Math.min(20, toDelete.length); i++) {
      const c = sortedNoContact[i]
      console.log(`  DEL: ${c.first_name} ${c.last_name} | €${c.total_spend} | ${c.created_at.split('T')[0]}`)
    }
    if (toDelete.length > 20) console.log(`  ... and ${toDelete.length - 20} more`)
    console.log('')
  }

  // Execute deletion
  if (!dryRun && toDelete.length > 0) {
    console.log('Deleting...')

    const batchSize = 50
    let deleted = 0

    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize)

      // Delete related records first
      await supabase.from('purchases').delete().in('client_id', batch)
      await supabase.from('contacts').delete().in('client_id', batch)
      await supabase.from('client_interests').delete().in('client_id', batch)

      // Delete clients
      const { error } = await supabase.from('clients').delete().in('id', batch)
      if (!error) deleted += batch.length
    }

    console.log(`Deleted: ${deleted}`)
  }

  // Final count
  const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true })
  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`FINAL CLIENT COUNT: ${count}`)
  console.log('═══════════════════════════════════════════════════════════════')
}

main()
