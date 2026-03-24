/**
 * Reassign clients to correct sellers using the source CSV as ground truth.
 * Matches clients by email or first_name+last_name, then sets the correct seller_id.
 *
 * Run: npx tsx scripts/reassign-from-csv.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import Papa from 'papaparse'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// CSV seller name (lowercased) → real profile email
const SELLER_TO_EMAIL: Record<string, string> = {
  'elliott nowack':        'elliott.nowack@casablancaparis.com',
  'helen kidane':          'helen.kidane@casablancaparis.com',
  'maxime hudzevych':      'maxime.hudzevych@casablancaparis.com',
  'raphael rivera':        'raphael.rivera@casablancaparis.com',
  'yassmine moutaouakil':  'yassmine.moutaouakil@casablancaparis.com',
  'hasael moussa':         'julane.moussa@casablancaparis.com',
  'julane moussa':         'julane.moussa@casablancaparis.com',
  'hicham el himar':       'hicham.elhimar@casablancaparis.com',
  // Former team → Hasael
  'hamza said':            'julane.moussa@casablancaparis.com',
  'ryan jackson':          'julane.moussa@casablancaparis.com',
  'kevin pastrana':        'julane.moussa@casablancaparis.com',
  'oriane adjourouvi':     'julane.moussa@casablancaparis.com',
  'naima mastour':         'julane.moussa@casablancaparis.com',
  'amadou diop':           'julane.moussa@casablancaparis.com',
}

async function main() {
  console.log('='.repeat(60))
  console.log('REASSIGNING CLIENTS FROM CSV SOURCE')
  console.log('='.repeat(60))

  // Load CSV
  const csv = fs.readFileSync('C:/Users/echof/Desktop/casblanca/cleanup_output/clients_clean.csv', 'utf8')
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true })
  const rows = parsed.data as Array<Record<string, string>>
  console.log(`\nCSV rows: ${rows.length}`)

  // Load active real profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('active', true)

  if (!profiles) { console.error('No profiles found'); return }

  const profileByEmail = new Map<string, { id: string; full_name: string }>()
  for (const p of profiles) {
    if (p.email) profileByEmail.set(p.email.toLowerCase(), { id: p.id, full_name: p.full_name })
  }

  console.log('\nTarget profiles:')
  for (const [email, p] of profileByEmail) {
    console.log(`  ${p.full_name.padEnd(25)} ${email}`)
  }

  // Load all clients from DB
  const { data: allClients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email, seller_id')

  if (!allClients) { console.error('No clients found'); return }
  console.log(`\nClients in DB: ${allClients.length}`)

  // Index clients by email (lowercase) and by name combo
  const clientByEmail = new Map<string, typeof allClients[0][]>()
  const clientByName = new Map<string, typeof allClients[0][]>()

  for (const c of allClients) {
    if (c.email) {
      const key = c.email.toLowerCase().trim()
      if (!clientByEmail.has(key)) clientByEmail.set(key, [])
      clientByEmail.get(key)!.push(c)
    }
    const nameKey = `${(c.first_name || '').toLowerCase().trim()}|${(c.last_name || '').toLowerCase().trim()}`
    if (nameKey !== '|') {
      if (!clientByName.has(nameKey)) clientByName.set(nameKey, [])
      clientByName.get(nameKey)!.push(c)
    }
  }

  // Process CSV rows
  const stats = { matched: 0, updated: 0, skipped: 0, notFound: 0, noSeller: 0 }
  const updates = new Map<string, string>() // client_id → target_seller_id

  for (const row of rows) {
    const sellerName = (row.seller || '').trim().toLowerCase()
    const targetEmail = SELLER_TO_EMAIL[sellerName]

    if (!targetEmail) {
      stats.noSeller++
      continue
    }

    const targetProfile = profileByEmail.get(targetEmail)
    if (!targetProfile) {
      stats.noSeller++
      continue
    }

    // Find client: by email first, then by name
    const clientEmail = (row.email || '').trim().toLowerCase()
    const firstName = (row.first_name || '').trim().toLowerCase()
    const lastName = (row.last_name || '').trim().toLowerCase()

    let matchedClients: typeof allClients | undefined

    if (clientEmail && clientEmail !== '#n/a' && clientEmail !== '') {
      matchedClients = clientByEmail.get(clientEmail)
    }

    if (!matchedClients && firstName && firstName !== '#n/a') {
      const nameKey = `${firstName}|${lastName}`
      matchedClients = clientByName.get(nameKey)
    }

    if (!matchedClients || matchedClients.length === 0) {
      stats.notFound++
      continue
    }

    stats.matched++
    for (const c of matchedClients) {
      if (c.seller_id !== targetProfile.id) {
        updates.set(c.id, targetProfile.id)
      } else {
        stats.skipped++
      }
    }
  }

  console.log(`\nCSV matching: ${stats.matched} matched, ${stats.notFound} not found, ${stats.noSeller} no seller mapping, ${stats.skipped} already correct`)
  console.log(`Updates to apply: ${updates.size}`)

  // Apply updates in batches
  if (updates.size > 0) {
    console.log('\n--- Applying updates ---')

    // Group by target seller for efficiency
    const bySeller = new Map<string, string[]>()
    for (const [clientId, sellerId] of updates) {
      if (!bySeller.has(sellerId)) bySeller.set(sellerId, [])
      bySeller.get(sellerId)!.push(clientId)
    }

    for (const [sellerId, clientIds] of bySeller) {
      const sellerProfile = profiles.find(p => p.id === sellerId)
      // Update in chunks of 50
      for (let i = 0; i < clientIds.length; i += 50) {
        const chunk = clientIds.slice(i, i + 50)
        const { error } = await supabase
          .from('clients')
          .update({ seller_id: sellerId })
          .in('id', chunk)

        if (error) {
          console.log(`  FAILED batch for ${sellerProfile?.full_name}: ${error.message}`)
        }
      }
      console.log(`  ${sellerProfile?.full_name?.padEnd(25)} ← ${clientIds.length} clients`)
      stats.updated += clientIds.length
    }
  }

  // Final verification
  console.log('\n' + '='.repeat(60))
  console.log('FINAL STATE')
  console.log('='.repeat(60))

  let grandTotal = 0
  for (const p of profiles) {
    const { count } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', p.id)
    const c = count || 0
    grandTotal += c
    if (c > 0 || p.email?.includes('@casablancaparis.com')) {
      console.log(`  [${p.role.padEnd(10)}] ${p.full_name.padEnd(25)} <${(p.email || '').padEnd(45)}> ${c} clients`)
    }
  }

  const { count: totalClients } = await supabase.from('clients').select('id', { count: 'exact', head: true })
  console.log(`\n  Total assigned: ${grandTotal} / ${totalClients} clients`)
  console.log(`  Updated: ${stats.updated}`)

  if (grandTotal < (totalClients || 0)) {
    console.log(`  WARNING: ${(totalClients || 0) - grandTotal} clients still on inactive profiles`)
  } else {
    console.log('  All clients assigned to active sellers.')
  }
}

main().catch(console.error)
