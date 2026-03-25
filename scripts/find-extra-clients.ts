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

async function main() {
  // Load CSV
  const csvPath = 'C:\\Users\\echof\\Desktop\\casblanca\\cleanup_output\\clients_clean.csv'
  const csvText = readFileSync(csvPath, 'utf-8')
  const { data: csvRows } = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true })

  // Build set of CSV emails (lowercase, trimmed)
  const csvEmails = new Set<string>()
  const csvPhones = new Set<string>()
  for (const row of csvRows) {
    const email = row.email?.toLowerCase().trim()
    const phone = row.phone?.replace(/\D/g, '')
    if (email) csvEmails.add(email)
    if (phone && phone.length >= 8) csvPhones.add(phone)
  }

  console.log(`CSV has ${csvRows.length} rows`)
  console.log(`CSV unique emails: ${csvEmails.size}`)
  console.log(`CSV unique phones: ${csvPhones.size}`)
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

  console.log(`DB has ${allClients.length} clients`)
  console.log('')

  // Find clients in DB that don't match any CSV row
  const extraClients: any[] = []
  const matchedClients: any[] = []

  for (const client of allClients) {
    const dbEmail = client.email?.toLowerCase().trim()
    const dbPhone = client.phone?.replace(/\D/g, '')

    let matched = false
    if (dbEmail && csvEmails.has(dbEmail)) matched = true
    if (!matched && dbPhone && dbPhone.length >= 8 && csvPhones.has(dbPhone)) matched = true

    if (matched) {
      matchedClients.push(client)
    } else {
      extraClients.push(client)
    }
  }

  console.log(`Matched to CSV: ${matchedClients.length}`)
  console.log(`NOT in CSV (extra): ${extraClients.length}`)
  console.log('')

  // Group extras by creation date
  const byDate = new Map<string, any[]>()
  for (const c of extraClients) {
    const date = c.created_at?.split('T')[0] || 'unknown'
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date)!.push(c)
  }

  console.log('Extra clients by creation date:')
  const sortedDates = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  for (const [date, clients] of sortedDates) {
    console.log(`  ${date}: ${clients.length} clients`)
  }
  console.log('')

  // Show sample extra clients
  if (extraClients.length > 0) {
    console.log('Sample extra clients (first 20):')
    for (const c of extraClients.slice(0, 20)) {
      const tag = c.notes?.includes('[import:casablanca-cleanup]') ? 'IMP' : 'OTHER'
      console.log(`  ${tag} | ${c.first_name} ${c.last_name} | ${c.email || '(no email)'} | ${c.phone || '(no phone)'} | €${c.total_spend} | ${c.created_at?.split('T')[0]}`)
    }
  }

  // Check if extras have import tag
  const taggedExtras = extraClients.filter(c => c.notes?.includes('[import:casablanca-cleanup]'))
  const untaggedExtras = extraClients.filter(c => !c.notes?.includes('[import:casablanca-cleanup]'))
  console.log('')
  console.log(`Extra clients with import tag: ${taggedExtras.length}`)
  console.log(`Extra clients without import tag: ${untaggedExtras.length}`)

  // These untagged extras should be safe to delete
  if (untaggedExtras.length > 0) {
    console.log('')
    console.log('Untagged extras (can be deleted):')
    for (const c of untaggedExtras.slice(0, 10)) {
      console.log(`  ${c.id} | ${c.first_name} ${c.last_name} | ${c.email || '(no email)'} | €${c.total_spend}`)
    }
  }
}

main()
