/**
 * CASA ONE — Deduplicate & Clean Clients
 *
 * 1. Removes non-import clients (demo data, test data without import tag)
 * 2. Removes duplicate clients created from multiple import runs
 *
 * Keeps the OLDEST row (original import), deletes newer duplicates.
 *
 * Usage:
 *   npm run dedupe:clients -- --dry-run   # Preview only
 *   npm run dedupe:clients                # Actually delete
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface Client {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  seller_id: string
  total_spend: number
  tier: string
  created_at: string
  notes: string | null
}

const IMPORT_TAG = '[import:casablanca-cleanup]'

interface DuplicateGroup {
  key: string
  clients: Client[]
  keepId: string
  deleteIds: string[]
}

async function fetchAllClients(): Promise<Client[]> {
  const allClients: Client[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data: batch, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, seller_id, total_spend, tier, created_at, notes')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to load clients:', error.message)
      process.exit(1)
    }

    if (!batch || batch.length === 0) break
    allClients.push(...(batch as Client[]))
    if (batch.length < pageSize) break
    page++
  }

  return allClients
}

function findDuplicates(clients: Client[]): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = []

  // Group 1: Duplicates by email + seller_id (where email exists)
  const byEmail = new Map<string, Client[]>()
  for (const client of clients) {
    if (client.email && client.email.trim()) {
      const key = `email:${client.email.toLowerCase()}:${client.seller_id}`
      if (!byEmail.has(key)) byEmail.set(key, [])
      byEmail.get(key)!.push(client)
    }
  }

  for (const [key, group] of byEmail) {
    if (group.length > 1) {
      // Sort by created_at ascending - keep oldest
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      duplicateGroups.push({
        key,
        clients: group,
        keepId: group[0].id,
        deleteIds: group.slice(1).map(c => c.id),
      })
    }
  }

  // Group 2: Duplicates by phone + seller_id (where phone exists but no email match)
  const alreadyInDupeGroup = new Set<string>()
  for (const group of duplicateGroups) {
    for (const client of group.clients) {
      alreadyInDupeGroup.add(client.id)
    }
  }

  const byPhone = new Map<string, Client[]>()
  for (const client of clients) {
    if (alreadyInDupeGroup.has(client.id)) continue
    if (client.phone && client.phone.trim()) {
      // Normalize phone for matching
      const normalizedPhone = client.phone.replace(/\D/g, '')
      if (normalizedPhone.length >= 8) {
        const key = `phone:${normalizedPhone}:${client.seller_id}`
        if (!byPhone.has(key)) byPhone.set(key, [])
        byPhone.get(key)!.push(client)
      }
    }
  }

  for (const [key, group] of byPhone) {
    if (group.length > 1) {
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      duplicateGroups.push({
        key,
        clients: group,
        keepId: group[0].id,
        deleteIds: group.slice(1).map(c => c.id),
      })
    }
  }

  // Update already processed set
  for (const group of duplicateGroups) {
    for (const client of group.clients) {
      alreadyInDupeGroup.add(client.id)
    }
  }

  // Group 3: Duplicates by name + seller_id + total_spend (no email/phone)
  const byNameSpend = new Map<string, Client[]>()
  for (const client of clients) {
    if (alreadyInDupeGroup.has(client.id)) continue
    // Only for clients without email AND without phone
    if ((!client.email || !client.email.trim()) && (!client.phone || !client.phone.trim())) {
      const key = `name:${client.first_name.toLowerCase()}:${client.last_name.toLowerCase()}:${client.seller_id}:${client.total_spend}`
      if (!byNameSpend.has(key)) byNameSpend.set(key, [])
      byNameSpend.get(key)!.push(client)
    }
  }

  for (const [key, group] of byNameSpend) {
    if (group.length > 1) {
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      duplicateGroups.push({
        key,
        clients: group,
        keepId: group[0].id,
        deleteIds: group.slice(1).map(c => c.id),
      })
    }
  }

  return duplicateGroups
}

async function deleteDuplicates(deleteIds: string[], dryRun: boolean): Promise<number> {
  if (dryRun || deleteIds.length === 0) return 0

  let deleted = 0

  // Delete in batches to avoid overwhelming the database
  const batchSize = 50
  for (let i = 0; i < deleteIds.length; i += batchSize) {
    const batch = deleteIds.slice(i, i + batchSize)

    // First delete related records (purchases, contacts, interests)
    await supabase.from('purchases').delete().in('client_id', batch)
    await supabase.from('contacts').delete().in('client_id', batch)
    await supabase.from('client_interests').delete().in('client_id', batch)

    // Then delete the clients
    const { error } = await supabase.from('clients').delete().in('id', batch)

    if (error) {
      console.error(`Failed to delete batch starting at ${i}:`, error.message)
    } else {
      deleted += batch.length
    }
  }

  return deleted
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('         CASA ONE — DEDUPLICATE & CLEAN CLIENTS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE (will delete)'}`)
  console.log('')

  // Load all clients
  console.log('Loading all clients...')
  const allClients = await fetchAllClients()
  console.log(`Loaded ${allClients.length} clients`)
  console.log('')

  // Step 1: Identify non-import clients (demo/test data without import tag)
  const importClients = allClients.filter(c => c.notes?.includes(IMPORT_TAG))
  const nonImportClients = allClients.filter(c => !c.notes?.includes(IMPORT_TAG))

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                 STEP 1: NON-IMPORT CLIENTS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Import-tagged clients:      ${importClients.length}`)
  console.log(`Non-import clients (demo):  ${nonImportClients.length}`)
  console.log('')

  if (nonImportClients.length > 0) {
    console.log('Sample non-import clients to delete (first 10):')
    for (const c of nonImportClients.slice(0, 10)) {
      console.log(`  ${c.first_name} ${c.last_name} | ${c.email || '(no email)'} | €${c.total_spend}`)
    }
    console.log('')
  }

  // Step 2: Find duplicates within import clients
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                 STEP 2: DUPLICATE ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log('Finding duplicates among import clients...')
  const duplicateGroups = findDuplicates(importClients)

  const totalDuplicatesToDelete = duplicateGroups.reduce((sum, g) => sum + g.deleteIds.length, 0)

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                    DUPLICATE ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Duplicate groups found:     ${duplicateGroups.length}`)
  console.log(`Total rows to delete:       ${totalDuplicatesToDelete}`)
  console.log(`Rows to keep:               ${importClients.length - totalDuplicatesToDelete}`)
  console.log('')

  // Breakdown by type
  const emailDupes = duplicateGroups.filter(g => g.key.startsWith('email:'))
  const phoneDupes = duplicateGroups.filter(g => g.key.startsWith('phone:'))
  const nameDupes = duplicateGroups.filter(g => g.key.startsWith('name:'))

  console.log('Breakdown:')
  console.log(`  By email + seller:        ${emailDupes.length} groups (${emailDupes.reduce((s, g) => s + g.deleteIds.length, 0)} to delete)`)
  console.log(`  By phone + seller:        ${phoneDupes.length} groups (${phoneDupes.reduce((s, g) => s + g.deleteIds.length, 0)} to delete)`)
  console.log(`  By name + spend + seller: ${nameDupes.length} groups (${nameDupes.reduce((s, g) => s + g.deleteIds.length, 0)} to delete)`)
  console.log('')

  // Show sample duplicate groups
  if (duplicateGroups.length > 0) {
    console.log('Sample duplicate groups (first 10):')
    for (const group of duplicateGroups.slice(0, 10)) {
      const keep = group.clients[0]
      console.log(`  ${group.key}`)
      console.log(`    KEEP: ${keep.first_name} ${keep.last_name} | €${keep.total_spend} | ${keep.tier} | created: ${keep.created_at.split('T')[0]}`)
      for (const del of group.clients.slice(1)) {
        console.log(`    DEL:  ${del.first_name} ${del.last_name} | €${del.total_spend} | ${del.tier} | created: ${del.created_at.split('T')[0]}`)
      }
    }
    console.log('')
  }

  // Verify duplicates have same data
  let mismatchCount = 0
  for (const group of duplicateGroups) {
    const keep = group.clients[0]
    for (const dup of group.clients.slice(1)) {
      if (Math.abs(keep.total_spend - dup.total_spend) > 0.01 || keep.tier !== dup.tier) {
        mismatchCount++
        if (mismatchCount <= 5) {
          console.log(`WARNING: Data mismatch in group ${group.key}:`)
          console.log(`  Keep: €${keep.total_spend} / ${keep.tier}`)
          console.log(`  Dup:  €${dup.total_spend} / ${dup.tier}`)
        }
      }
    }
  }
  if (mismatchCount > 0) {
    console.log(`\nWARNING: ${mismatchCount} duplicate pairs have different spend/tier values`)
    console.log('These may need manual review. Proceeding will keep the oldest record.\n')
  }

  // Summary
  const totalToDelete = nonImportClients.length + totalDuplicatesToDelete
  const expectedFinal = allClients.length - totalToDelete

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                       SUMMARY')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Current total:              ${allClients.length}`)
  console.log(`Non-import to delete:       ${nonImportClients.length}`)
  console.log(`Duplicates to delete:       ${totalDuplicatesToDelete}`)
  console.log(`TOTAL TO DELETE:            ${totalToDelete}`)
  console.log(`Expected final count:       ${expectedFinal}`)
  console.log('')

  // Execute deletions
  if (!dryRun && totalToDelete > 0) {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('                     EXECUTING DELETIONS')
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('')

    // Delete non-import clients first
    if (nonImportClients.length > 0) {
      console.log(`Deleting ${nonImportClients.length} non-import clients...`)
      const nonImportIds = nonImportClients.map(c => c.id)
      const deletedNonImport = await deleteDuplicates(nonImportIds, dryRun)
      console.log(`  Deleted: ${deletedNonImport}`)
    }

    // Delete duplicates
    if (totalDuplicatesToDelete > 0) {
      console.log(`Deleting ${totalDuplicatesToDelete} duplicate clients...`)
      const allDeleteIds = duplicateGroups.flatMap(g => g.deleteIds)
      const deletedDupes = await deleteDuplicates(allDeleteIds, dryRun)
      console.log(`  Deleted: ${deletedDupes}`)
    }
    console.log('')
  }

  // Final count
  if (!dryRun) {
    const { count: finalCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
    console.log('═══════════════════════════════════════════════════════════════')
    console.log(`FINAL CLIENT COUNT: ${finalCount}`)
    console.log('═══════════════════════════════════════════════════════════════')
  } else {
    console.log('═══════════════════════════════════════════════════════════════')
    console.log('DRY RUN COMPLETE — No changes made')
    console.log(`Run without --dry-run to delete ${totalToDelete} clients`)
    console.log('═══════════════════════════════════════════════════════════════')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
