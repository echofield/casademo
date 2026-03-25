import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Fetch all clients with pagination
  const allClients: any[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, seller_id, notes, created_at')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) { console.error(error); break }
    if (!data || data.length === 0) break
    allClients.push(...data)
    if (data.length < pageSize) break
    page++
  }

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('              DATABASE CLIENT ANALYSIS')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('')
  console.log(`Total clients: ${allClients.length}`)
  console.log('')

  // Tagged vs untagged
  const tagged = allClients.filter(c => c.notes?.includes('[import:casablanca-cleanup]'))
  const untagged = allClients.filter(c => !c.notes?.includes('[import:casablanca-cleanup]'))

  console.log('By import tag:')
  console.log(`  Tagged (casablanca import):   ${tagged.length}`)
  console.log(`  Untagged (other source):      ${untagged.length}`)
  console.log('')

  // Check for duplicate emails across tagged clients
  const emailCounts = new Map<string, any[]>()
  for (const c of allClients) {
    if (c.email && c.email.trim()) {
      const key = c.email.toLowerCase()
      if (!emailCounts.has(key)) emailCounts.set(key, [])
      emailCounts.get(key)!.push(c)
    }
  }

  const dupEmails = [...emailCounts.entries()].filter(([_, clients]) => clients.length > 1)
  console.log(`Duplicate emails found: ${dupEmails.length}`)
  if (dupEmails.length > 0) {
    console.log('First 5 duplicate email groups:')
    for (const [email, clients] of dupEmails.slice(0, 5)) {
      console.log(`  ${email}:`)
      for (const c of clients) {
        const tag = c.notes?.includes('[import:casablanca-cleanup]') ? 'TAGGED' : 'UNTAGGED'
        console.log(`    ${c.first_name} ${c.last_name} | ${tag} | created: ${c.created_at?.split('T')[0]}`)
      }
    }
  }
  console.log('')

  // Check untagged clients
  if (untagged.length > 0) {
    console.log('Untagged clients sample (first 10):')
    for (const c of untagged.slice(0, 10)) {
      console.log(`  ${c.first_name} ${c.last_name} | ${c.email || '(no email)'} | notes: ${c.notes?.slice(0, 50) || '(none)'}`)
    }
    console.log('')
  }

  // Created dates distribution
  const byDate = new Map<string, number>()
  for (const c of allClients) {
    const date = c.created_at?.split('T')[0] || 'unknown'
    byDate.set(date, (byDate.get(date) || 0) + 1)
  }
  console.log('Clients by creation date:')
  const sortedDates = [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  for (const [date, count] of sortedDates.slice(0, 10)) {
    console.log(`  ${date}: ${count}`)
  }
  console.log('')

  console.log('═══════════════════════════════════════════════════════════════')
}

main()
