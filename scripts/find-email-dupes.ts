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
      .select('id, first_name, last_name, email, phone, seller_id, total_spend, created_at, notes')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('created_at', { ascending: true })

    if (error) { console.error(error); break }
    if (!data || data.length === 0) break
    allClients.push(...data)
    if (data.length < pageSize) break
    page++
  }

  console.log(`Total clients: ${allClients.length}`)
  console.log('')

  // Find email duplicates (different names, same email)
  const byEmail = new Map<string, any[]>()
  for (const c of allClients) {
    if (c.email && c.email.trim()) {
      const key = c.email.toLowerCase().trim()
      if (!byEmail.has(key)) byEmail.set(key, [])
      byEmail.get(key)!.push(c)
    }
  }

  const emailDupes = [...byEmail.entries()]
    .filter(([_, clients]) => clients.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log(`Emails with multiple clients: ${emailDupes.length}`)
  console.log('')

  if (emailDupes.length > 0) {
    console.log('First 20 email duplicate groups:')
    for (const [email, clients] of emailDupes.slice(0, 20)) {
      console.log(`\n  ${email} (${clients.length} clients):`)
      for (const c of clients) {
        const tag = c.notes?.includes('[import:casablanca-cleanup]') ? 'IMP' : 'OTHER'
        console.log(`    ${tag} | ${c.first_name} ${c.last_name} | €${c.total_spend} | seller: ${c.seller_id.slice(0,8)}... | ${c.created_at.split('T')[0]}`)
      }
    }
  }

  // Also check phone duplicates
  const byPhone = new Map<string, any[]>()
  for (const c of allClients) {
    if (c.phone && c.phone.trim()) {
      const key = c.phone.replace(/\D/g, '') // normalize
      if (key.length >= 8) {
        if (!byPhone.has(key)) byPhone.set(key, [])
        byPhone.get(key)!.push(c)
      }
    }
  }

  const phoneDupes = [...byPhone.entries()]
    .filter(([_, clients]) => clients.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log(`\n\nPhones with multiple clients: ${phoneDupes.length}`)

  if (phoneDupes.length > 0) {
    console.log('First 10 phone duplicate groups:')
    for (const [phone, clients] of phoneDupes.slice(0, 10)) {
      console.log(`\n  ${phone} (${clients.length} clients):`)
      for (const c of clients) {
        const tag = c.notes?.includes('[import:casablanca-cleanup]') ? 'IMP' : 'OTHER'
        console.log(`    ${tag} | ${c.first_name} ${c.last_name} | ${c.email || '(no email)'} | €${c.total_spend}`)
      }
    }
  }
}

main()
