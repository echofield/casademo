/**
 * Import clients from cleaned CSV
 * Run with: npx tsx scripts/import-clients.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CsvRow {
  first_name: string
  last_name: string
  email: string
  phone: string
  seller: string
  total_spend: string
  tier: string
  purchase_history: string
  first_contact_date: string
  last_contact_date: string
  interests: string
  notes: string
}

function parseCSV(content: string): CsvRow[] {
  const lines = content.split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, '')) // Remove BOM

  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted fields with commas
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ''
    })

    rows.push(row as CsvRow)
  }

  return rows
}

function cleanName(name: string): string | null {
  if (!name || name === '#N/A' || name === '0' || name === 'N/A') {
    return null
  }
  return name.trim()
}

function cleanEmail(email: string): string | null {
  if (!email || email === '#N/A') return null
  // Fix common typos
  return email.replace('côm', 'com').trim().toLowerCase()
}

function cleanPhone(phone: string): string | null {
  if (!phone || phone === '#N/A') return null
  return phone.trim()
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === '#N/A') return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return d.toISOString().split('T')[0]
  } catch {
    return null
  }
}

function parsePurchases(purchaseStr: string): { description: string; amount: number }[] {
  if (!purchaseStr) return []

  const purchases: { description: string; amount: number }[] = []

  // Format: "Item Name (123€), Another Item (456€)"
  const regex = /([^,]+?)\s*\((\d+(?:[,.]?\d+)?)\s*€\)/g
  let match

  while ((match = regex.exec(purchaseStr)) !== null) {
    const description = match[1].trim()
    const amountStr = match[2].replace(',', '.')
    const amount = parseFloat(amountStr)

    if (!isNaN(amount) && amount > 0) {
      purchases.push({ description, amount })
    }
  }

  return purchases
}

// Seller name mapping from CSV to DB names
const SELLER_NAME_MAP: Record<string, string> = {
  'elliott nowack': 'Elliott N',
  'yassmine moutaouakil': 'Yassmine',
  'maxime hudzevych': 'Maxime H',
  'kevin pastrana': '__SUPERVISOR__', // Assign to supervisor for manual dispatch
}

async function main() {
  const csvPath = path.join('C:', 'Users', 'echof', 'Desktop', 'casblanca', 'cleanup_output', 'clients_clean.csv')

  console.log('Reading CSV from:', csvPath)
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)

  console.log(`Parsed ${rows.length} rows`)

  // Get all profiles (sellers and supervisors)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')

  if (profileError) {
    console.error('Failed to fetch profiles:', profileError)
    process.exit(1)
  }

  // Build seller map by name
  const sellerMap = new Map<string, string>()
  let supervisorId: string | null = null

  profiles?.forEach(p => {
    sellerMap.set(p.full_name.toLowerCase(), p.id)
    // Use Hasael Moussa as the supervisor to hold Kevin's clients
    if (p.full_name.toLowerCase().includes('hasael') || p.role === 'supervisor') {
      supervisorId = p.id
    }
  })

  console.log('Profiles in DB:', Array.from(sellerMap.keys()))
  console.log('Supervisor ID for Kevin clients:', supervisorId)

  // Find unique sellers in CSV
  const csvSellers = new Set(rows.map(r => r.seller.toLowerCase().trim()))
  console.log('Sellers in CSV:', Array.from(csvSellers))

  // Default seller (supervisor for unmatched)
  const defaultSellerId = supervisorId || profiles?.[0]?.id || null
  console.log('Default seller ID:', defaultSellerId)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const row of rows) {
    const firstName = cleanName(row.first_name)
    const lastName = cleanName(row.last_name)
    const email = cleanEmail(row.email)
    const phone = cleanPhone(row.phone)

    // Skip if no contact info at all
    if (!email && !phone && !firstName && !lastName) {
      skipped++
      continue
    }

    // Find seller using mapping
    const csvSellerName = row.seller.toLowerCase().trim()
    const mappedName = SELLER_NAME_MAP[csvSellerName]
    let sellerId: string | null = null

    if (mappedName === '__SUPERVISOR__') {
      // Kevin's clients go to supervisor for manual dispatch
      sellerId = supervisorId
      console.log(`  → Kevin client: ${firstName} ${lastName} → assigned to supervisor`)
    } else if (mappedName) {
      // Use mapped name to find seller
      sellerId = sellerMap.get(mappedName.toLowerCase())
    }

    if (!sellerId) {
      // Try direct match
      sellerId = sellerMap.get(csvSellerName)
    }

    if (!sellerId) {
      // Try partial match
      for (const [name, id] of sellerMap) {
        if (name.includes(csvSellerName) || csvSellerName.includes(name.split(' ')[0].toLowerCase())) {
          sellerId = id
          break
        }
      }
    }

    if (!sellerId) {
      sellerId = defaultSellerId
      console.log(`  → No match for seller "${row.seller}", using default`)
    }

    if (!sellerId) {
      console.warn(`Skipping row - no seller found for: ${row.seller}`)
      skipped++
      continue
    }

    const totalSpend = parseFloat(row.total_spend) || 0
    const tier = row.tier.toLowerCase().replace(' ', '_')

    // Insert client
    const { data: client, error: insertError } = await supabase
      .from('clients')
      .insert({
        first_name: firstName || 'Unknown',
        last_name: lastName || '',
        email: email,
        phone: phone,
        seller_id: sellerId,
        total_spend: totalSpend,
        tier: tier,
        first_contact_date: parseDate(row.first_contact_date),
        last_contact_date: parseDate(row.last_contact_date),
        next_recontact_date: parseDate(row.last_contact_date), // Set next = last for now
        notes: row.notes || null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(`Error inserting client ${firstName} ${lastName}:`, insertError.message)
      errors++
      continue
    }

    // Insert interests if any
    if (row.interests && client) {
      const interests = row.interests.split(',').map(i => i.trim()).filter(Boolean)
      for (const interest of interests) {
        await supabase.from('client_interests').insert({
          client_id: client.id,
          category: 'Produits',
          value: interest,
        })
      }
    }

    // Insert purchases if any
    if (row.purchase_history && client) {
      const purchases = parsePurchases(row.purchase_history)
      const purchaseDate = parseDate(row.first_contact_date) || new Date().toISOString().split('T')[0]

      for (const p of purchases) {
        await supabase.from('purchases').insert({
          client_id: client.id,
          amount: p.amount,
          description: p.description,
          purchase_date: purchaseDate,
        })
      }
    }

    imported++

    if (imported % 100 === 0) {
      console.log(`Imported ${imported} clients...`)
    }
  }

  console.log('\n=== Import Complete ===')
  console.log(`Imported: ${imported}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
}

main().catch(console.error)
