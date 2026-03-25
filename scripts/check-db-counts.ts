import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function check() {
  // Total clients
  const { count: total } = await supabase.from('clients').select('*', { count: 'exact', head: true })

  // Tagged clients (from import)
  const { count: tagged } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .ilike('notes', '%[import:casablanca-cleanup]%')

  // Demo clients
  const { count: demo } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .ilike('notes', '%[demo]%')

  // With N/A names
  const { count: naFirst } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('first_name', 'N/A')
  const { count: naLast } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('last_name', 'N/A')

  // No-contact tagged
  const { count: noContact } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .ilike('notes', '%[no-contact]%')

  console.log('═══════════════════════════════════════════')
  console.log('        DATABASE COUNTS')
  console.log('═══════════════════════════════════════════')
  console.log(`  Total clients:      ${total}`)
  console.log(`  Tagged (import):    ${tagged}`)
  console.log(`  Demo:               ${demo}`)
  console.log(`  N/A first_name:     ${naFirst}`)
  console.log(`  N/A last_name:      ${naLast}`)
  console.log(`  No-contact tagged:  ${noContact}`)
  console.log('═══════════════════════════════════════════')
}

check()
