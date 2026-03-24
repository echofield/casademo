/**
 * Clean Demo Data Script
 * Removes all demo clients and related data before production import.
 *
 * Run: npm run clean:demo
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function cleanDemoData() {
  console.log('='.repeat(60))
  console.log('CLEANING DEMO DATA')
  console.log('='.repeat(60))
  console.log()

  // 1. Get all demo client IDs
  const { data: demoClients, error: fetchError } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .or('is_demo.eq.true,notes.ilike.%demo%')

  if (fetchError) {
    console.error('Error fetching demo clients:', fetchError.message)
    process.exit(1)
  }

  if (!demoClients || demoClients.length === 0) {
    console.log('No demo clients found. Database is clean.')
    return
  }

  const clientIds = demoClients.map(c => c.id)
  console.log(`Found ${demoClients.length} demo clients to remove:`)
  demoClients.slice(0, 10).forEach(c => console.log(`  - ${c.first_name} ${c.last_name}`))
  if (demoClients.length > 10) console.log(`  ... and ${demoClients.length - 10} more`)
  console.log()

  // 2. Delete related data (cascade order matters)
  console.log('Deleting related data...')

  // Delete visits
  const { count: visitsDeleted } = await supabase
    .from('visits')
    .delete({ count: 'exact' })
    .in('client_id', clientIds)
  console.log(`  - Visits: ${visitsDeleted || 0} deleted`)

  // Delete client_sizing
  const { count: sizingDeleted } = await supabase
    .from('client_sizing')
    .delete({ count: 'exact' })
    .in('client_id', clientIds)
  console.log(`  - Client sizing: ${sizingDeleted || 0} deleted`)

  // Delete purchases
  const { count: purchasesDeleted } = await supabase
    .from('purchases')
    .delete({ count: 'exact' })
    .in('client_id', clientIds)
  console.log(`  - Purchases: ${purchasesDeleted || 0} deleted`)

  // Delete contacts
  const { count: contactsDeleted } = await supabase
    .from('contacts')
    .delete({ count: 'exact' })
    .in('client_id', clientIds)
  console.log(`  - Contacts: ${contactsDeleted || 0} deleted`)

  // Delete client_interests
  const { count: interestsDeleted } = await supabase
    .from('client_interests')
    .delete({ count: 'exact' })
    .in('client_id', clientIds)
  console.log(`  - Client interests: ${interestsDeleted || 0} deleted`)

  // Delete meetings (if table exists)
  try {
    const { count: meetingsDeleted } = await supabase
      .from('meetings')
      .delete({ count: 'exact' })
      .in('client_id', clientIds)
    console.log(`  - Meetings: ${meetingsDeleted || 0} deleted`)
  } catch {
    // Meetings table may not exist yet
  }

  // 3. Delete demo clients
  console.log('\nDeleting demo clients...')
  const { count: clientsDeleted, error: deleteError } = await supabase
    .from('clients')
    .delete({ count: 'exact' })
    .in('id', clientIds)

  if (deleteError) {
    console.error('Error deleting clients:', deleteError.message)
    process.exit(1)
  }

  console.log(`  - Clients: ${clientsDeleted || 0} deleted`)

  // 4. Summary
  console.log()
  console.log('='.repeat(60))
  console.log('CLEANUP COMPLETE')
  console.log('='.repeat(60))
  console.log(`Removed ${clientsDeleted || 0} demo clients and all related data.`)
  console.log('Database is now ready for production import.')
}

cleanDemoData().catch(console.error)
