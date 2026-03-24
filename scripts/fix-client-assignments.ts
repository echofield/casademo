/**
 * Fix client seller assignments after account migration.
 * Maps clients from old profiles (demo @casaone.fr) to new real @casablancaparis.com profiles
 * using the seller name from the original CSV as the link.
 *
 * Run: npx tsx scripts/fix-client-assignments.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// CSV seller name (case-insensitive) → real email
const SELLER_MAP: Record<string, string> = {
  'elliott nowack':        'elliott.nowack@casablancaparis.com',
  'helen kidane':          'helen.kidane@casablancaparis.com',
  'maxime hudzevych':      'maxime.hudzevych@casablancaparis.com',
  'raphael rivera':        'raphael.rivera@casablancaparis.com',
  'yassmine moutaouakil':  'yassmine.moutaouakil@casablancaparis.com',
  'hasael moussa':         'julane.moussa@casablancaparis.com',
  'julane moussa':         'julane.moussa@casablancaparis.com',
  'hicham el himar':       'hicham.elhimar@casablancaparis.com',
}

// Former sellers → reassign to Hasael (supervisor will dispatch)
const REASSIGN_TO_HASAEL = [
  'hamza said',
  'ryan jackson',
  'kevin pastrana',
  'oriane adjourouvi',
  'naima mastour',
  'amadou diop',
]

async function main() {
  console.log('='.repeat(60))
  console.log('FIXING CLIENT ASSIGNMENTS')
  console.log('='.repeat(60))
  console.log()

  // Load all profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, active')

  if (!allProfiles) { console.error('Failed to load profiles'); return }

  // Build lookup: real email → profile ID (active profiles only)
  const realProfileByEmail = new Map<string, string>()
  for (const p of allProfiles.filter(p => p.active && p.email?.includes('@casablancaparis.com'))) {
    realProfileByEmail.set(p.email.toLowerCase(), p.id)
  }

  console.log('Active real profiles:')
  for (const [email, id] of realProfileByEmail) {
    console.log(`  ${email} → ${id}`)
  }

  const hasaelId = realProfileByEmail.get('julane.moussa@casablancaparis.com')
  if (!hasaelId) {
    console.error('Hasael profile not found!'); return
  }

  // Process each old profile that has clients
  console.log('\n--- Relinking clients ---')
  let totalRelinked = 0

  for (const oldProfile of allProfiles) {
    // Skip active real profiles
    if (oldProfile.active && oldProfile.email?.includes('@casablancaparis.com')) continue

    // Count clients on this old profile
    const { count } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', oldProfile.id)

    if (!count || count === 0) continue

    const nameKey = (oldProfile.full_name || '').toLowerCase().trim()

    // Check if this seller maps to a current team member
    let targetId: string | null = null
    let targetLabel = ''

    if (SELLER_MAP[nameKey]) {
      targetId = realProfileByEmail.get(SELLER_MAP[nameKey]) || null
      targetLabel = SELLER_MAP[nameKey]
    } else if (REASSIGN_TO_HASAEL.includes(nameKey)) {
      targetId = hasaelId
      targetLabel = 'julane.moussa@casablancaparis.com (Hasael — to dispatch)'
    }

    if (!targetId) {
      // Unknown seller — assign to Hasael
      targetId = hasaelId
      targetLabel = 'julane.moussa@casablancaparis.com (Hasael — unknown seller)'
    }

    // Skip if already pointing to the right profile
    if (oldProfile.id === targetId) {
      console.log(`  SKIP (already correct): ${oldProfile.full_name} (${count} clients)`)
      continue
    }

    // Relink
    const { error } = await supabase
      .from('clients')
      .update({ seller_id: targetId })
      .eq('seller_id', oldProfile.id)

    if (error) {
      console.log(`  FAILED: ${oldProfile.full_name}: ${error.message}`)
      continue
    }

    console.log(`  RELINKED: "${oldProfile.full_name}" <${oldProfile.email}> → ${targetLabel} (${count} clients)`)
    totalRelinked += count
  }

  console.log(`\nTotal clients relinked: ${totalRelinked}`)

  // Final verification
  console.log('\n' + '='.repeat(60))
  console.log('FINAL STATE')
  console.log('='.repeat(60))

  const { data: activeProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('active', true)
    .order('role')
    .order('full_name')

  let grandTotal = 0
  for (const p of activeProfiles || []) {
    const { count } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', p.id)
    const c = count || 0
    grandTotal += c
    console.log(`  [${p.role.padEnd(10)}] ${p.full_name.padEnd(25)} <${p.email.padEnd(45)}> ${c} clients`)
  }

  const { count: totalClients } = await supabase.from('clients').select('id', { count: 'exact', head: true })
  console.log(`\n  Total assigned: ${grandTotal} / ${totalClients} clients in DB`)

  if (grandTotal < (totalClients || 0)) {
    console.log(`  WARNING: ${(totalClients || 0) - grandTotal} clients still orphaned!`)
  } else {
    console.log('  All clients assigned to active sellers.')
  }
}

main().catch(console.error)
