import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 300 unique client names - diverse, realistic
const FIRST_NAMES = [
  'James', 'William', 'Oliver', 'Benjamin', 'Lucas', 'Henry', 'Alexander', 'Sebastian', 'Jack', 'Daniel',
  'Michael', 'Matthew', 'Joseph', 'David', 'Andrew', 'Thomas', 'Christopher', 'Joshua', 'Ethan', 'Ryan',
  'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Mia', 'Charlotte', 'Amelia', 'Harper', 'Evelyn',
  'Victoria', 'Eleanor', 'Grace', 'Chloe', 'Penelope', 'Lily', 'Hannah', 'Natalie', 'Zoe', 'Leah',
  'Marcus', 'Adrian', 'Julian', 'Leo', 'Nathan', 'Aaron', 'Isaac', 'Evan', 'Gabriel', 'Anthony',
  'Sofia', 'Camila', 'Valentina', 'Luna', 'Aria', 'Scarlett', 'Audrey', 'Claire', 'Stella', 'Maya',
  'Robert', 'Edward', 'George', 'Charles', 'Philip', 'Richard', 'Stephen', 'Patrick', 'Vincent', 'Lawrence',
  'Katherine', 'Margaret', 'Elizabeth', 'Caroline', 'Josephine', 'Madeline', 'Abigail', 'Rebecca', 'Rachel', 'Sarah',
  'Nicolas', 'Pierre', 'François', 'Antoine', 'Louis', 'Hugo', 'Maxime', 'Alexandre', 'Théo', 'Arthur',
  'Marie', 'Camille', 'Léa', 'Manon', 'Julie', 'Laura', 'Pauline', 'Margot', 'Chloé', 'Inès',
]

const LAST_NAMES = [
  'Anderson', 'Thompson', 'Williams', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
  'Martin', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall',
  'Chen', 'Wang', 'Liu', 'Zhang', 'Kim', 'Park', 'Nguyen', 'Patel', 'Singh', 'Khan',
  'Müller', 'Schmidt', 'Schneider', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Fischer', 'Meyer', 'Koch',
  'Dubois', 'Laurent', 'Bernard', 'Moreau', 'Petit', 'Leroy', 'Roux', 'David', 'Bertrand', 'Simon',
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno',
  'Santos', 'Silva', 'Costa', 'Oliveira', 'Ferreira', 'Pereira', 'Almeida', 'Sousa', 'Carvalho', 'Gomes',
  'Ivanov', 'Petrov', 'Volkov', 'Kozlov', 'Novikov', 'Morozov', 'Sokolov', 'Popov', 'Lebedev', 'Kuznetsov',
]

// Tier distribution for 300 clients (realistic luxury retail)
// Grand Prix: 3%, Diplomatico: 5%, Idealiste: 12%, Kaizen: 25%, Optimisto: 25%, Rainbow: 30%
const TIER_DISTRIBUTION = {
  grand_prix: 9,      // 3%
  diplomatico: 15,    // 5%
  idealiste: 36,      // 12%
  kaizen: 75,         // 25%
  optimisto: 75,      // 25%
  rainbow: 90,        // 30%
}

const TIER_SPEND_RANGES: Record<string, [number, number]> = {
  grand_prix: [28000, 85000],
  diplomatico: [18000, 27000],
  idealiste: [10500, 17500],
  kaizen: [2800, 10000],
  optimisto: [1100, 2700],
  rainbow: [150, 1000],
}

const TIER_RECONTACT_DAYS: Record<string, number> = {
  grand_prix: 7,
  diplomatico: 14,
  idealiste: 21,
  kaizen: 30,
  optimisto: 45,
  rainbow: 60,
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generatePhone(): string {
  const prefix = randomElement(['+1', '+44', '+33', '+49', '+39', '+34'])
  const num = Array.from({ length: 9 }, () => randomInt(0, 9)).join('')
  return `${prefix} ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`
}

function generateEmail(first: string, last: string): string {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'proton.me']
  const formats = [
    `${first.toLowerCase()}.${last.toLowerCase()}`,
    `${first.toLowerCase()}${last.toLowerCase()}`,
    `${first.toLowerCase()[0]}${last.toLowerCase()}`,
    `${first.toLowerCase()}.${last.toLowerCase()}${randomInt(1, 99)}`,
  ]
  return `${randomElement(formats)}@${randomElement(domains)}`
}

async function main() {
  console.log('Creating comprehensive demo data...\n')

  // Get real sellers
  const { data: sellers, error: sellersError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('active', true)

  if (sellersError || !sellers?.length) {
    console.error('No sellers found:', sellersError)
    return
  }

  console.log(`Found ${sellers.length} sellers:`)
  sellers.forEach(s => console.log(`  - ${s.full_name}`))
  console.log('')

  // Delete existing demo data
  console.log('Clearing existing demo data...')

  // Delete demo contacts first (foreign key)
  const { data: demoClients } = await supabase
    .from('clients')
    .select('id')
    .eq('is_demo', true)

  if (demoClients?.length) {
    const clientIds = demoClients.map(c => c.id)
    await supabase.from('contacts').delete().in('client_id', clientIds)
    await supabase.from('purchases').delete().in('client_id', clientIds)
    await supabase.from('client_interests').delete().in('client_id', clientIds)
  }

  await supabase.from('clients').delete().eq('is_demo', true)
  console.log('Cleared existing demo clients and related data\n')

  // Generate unique names
  const usedNames = new Set<string>()
  function getUniqueName(): { first: string; last: string } {
    let attempts = 0
    while (attempts < 100) {
      const first = randomElement(FIRST_NAMES)
      const last = randomElement(LAST_NAMES)
      const key = `${first}_${last}`
      if (!usedNames.has(key)) {
        usedNames.add(key)
        return { first, last }
      }
      attempts++
    }
    // Fallback with number suffix
    const first = randomElement(FIRST_NAMES)
    const last = randomElement(LAST_NAMES)
    return { first, last: `${last}-${randomInt(1, 99)}` }
  }

  // Build client list by tier
  const clientsToCreate: Array<{
    first_name: string
    last_name: string
    email: string
    phone: string
    tier: string
    total_spend: number
    seller_id: string
    is_demo: boolean
    last_contact_date: string
    next_recontact_date: string
    notes: string
  }> = []

  // Distribute clients among sellers (some sellers get more)
  // Top sellers get 20-30%, others get less
  const sellerWeights = sellers.map((s, i) => ({
    seller: s,
    weight: i < 3 ? 3 : i < 6 ? 2 : 1  // First 3 sellers get more clients
  }))
  const totalWeight = sellerWeights.reduce((sum, sw) => sum + sw.weight, 0)

  function getWeightedSeller() {
    const rand = Math.random() * totalWeight
    let cumulative = 0
    for (const sw of sellerWeights) {
      cumulative += sw.weight
      if (rand <= cumulative) return sw.seller
    }
    return sellers[0]
  }

  const today = new Date()

  for (const [tier, count] of Object.entries(TIER_DISTRIBUTION)) {
    console.log(`Generating ${count} ${tier} clients...`)

    for (let i = 0; i < count; i++) {
      const { first, last } = getUniqueName()
      const seller = getWeightedSeller()
      const [minSpend, maxSpend] = TIER_SPEND_RANGES[tier]
      const totalSpend = randomInt(minSpend, maxSpend)

      // Last contact: random within last 90 days
      const lastContactDaysAgo = randomInt(1, 90)
      const lastContact = new Date(today)
      lastContact.setDate(lastContact.getDate() - lastContactDaysAgo)

      // Next recontact: based on tier interval from last contact
      const recontactDays = TIER_RECONTACT_DAYS[tier]
      const nextRecontact = new Date(lastContact)
      nextRecontact.setDate(nextRecontact.getDate() + recontactDays)

      clientsToCreate.push({
        first_name: first,
        last_name: last,
        email: generateEmail(first, last),
        phone: generatePhone(),
        tier,
        total_spend: totalSpend,
        seller_id: seller.id,
        is_demo: true,
        last_contact_date: lastContact.toISOString().split('T')[0],
        next_recontact_date: nextRecontact.toISOString().split('T')[0],
        notes: '[demo]',
      })
    }
  }

  // Insert clients in batches
  console.log(`\nInserting ${clientsToCreate.length} demo clients...`)
  const batchSize = 50
  let created = 0

  for (let i = 0; i < clientsToCreate.length; i += batchSize) {
    const batch = clientsToCreate.slice(i, i + batchSize)
    const { error } = await supabase.from('clients').insert(batch)
    if (error) {
      console.error(`Batch error:`, error.message)
    } else {
      created += batch.length
    }
  }
  console.log(`Created ${created} clients`)

  // Fetch created clients for contact generation
  const { data: createdClients } = await supabase
    .from('clients')
    .select('id, seller_id, tier, last_contact_date')
    .eq('is_demo', true)

  if (!createdClients?.length) {
    console.error('No clients created')
    return
  }

  // Generate contacts for the past 7 days (for activity metrics)
  console.log('\nGenerating demo contacts for past 7 days...')
  const contactsToCreate: Array<{
    client_id: string
    seller_id: string
    contact_date: string
    channel: string
    comment: string
  }> = []

  const channels = ['phone', 'email', 'in_person', 'whatsapp']
  const comments = [
    'Follow-up call completed',
    'Discussed new collection',
    'Product inquiry',
    'Scheduled appointment',
    'Sent catalog',
    'Birthday wishes',
    'Thank you call',
    'Event invitation',
  ]

  // Create contacts for ~40% of clients (realistic activity)
  const clientsWithRecentContact = createdClients
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(createdClients.length * 0.4))

  for (const client of clientsWithRecentContact) {
    const daysAgo = randomInt(0, 6)
    const contactDate = new Date(today)
    contactDate.setDate(contactDate.getDate() - daysAgo)

    contactsToCreate.push({
      client_id: client.id,
      seller_id: client.seller_id,
      contact_date: contactDate.toISOString().split('T')[0],
      channel: randomElement(channels),
      comment: randomElement(comments),
    })
  }

  // Insert contacts
  if (contactsToCreate.length > 0) {
    const { error: contactError } = await supabase.from('contacts').insert(contactsToCreate)
    if (contactError) {
      console.error('Contact insert error:', contactError.message)
    } else {
      console.log(`Created ${contactsToCreate.length} demo contacts`)
    }
  }

  // Summary by seller
  console.log('\n--- SUMMARY BY SELLER ---')
  const sellerSummary = new Map<string, { name: string; count: number; tiers: Record<string, number> }>()

  for (const seller of sellers) {
    sellerSummary.set(seller.id, { name: seller.full_name, count: 0, tiers: {} })
  }

  for (const client of clientsToCreate) {
    const s = sellerSummary.get(client.seller_id)
    if (s) {
      s.count++
      s.tiers[client.tier] = (s.tiers[client.tier] || 0) + 1
    }
  }

  for (const [, data] of sellerSummary) {
    if (data.count > 0) {
      console.log(`${data.name}: ${data.count} clients`)
      console.log(`  Tiers: ${JSON.stringify(data.tiers)}`)
    }
  }

  console.log('\n--- DONE ---')
  console.log(`Total clients: ${created}`)
  console.log(`Total contacts: ${contactsToCreate.length}`)
}

main().catch(console.error)
