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

// Seed data
const SUPERVISORS = [
  { email: 'marie@casaone.fr', full_name: 'Marie Laurent', password: 'supervisor123' },
  { email: 'pierre@casaone.fr', full_name: 'Pierre Dubois', password: 'supervisor123' },
]

const SELLERS = [
  { email: 'alice@casaone.fr', full_name: 'Alice Martin', password: 'seller123' },
  { email: 'lucas@casaone.fr', full_name: 'Lucas Bernard', password: 'seller123' },
  { email: 'emma@casaone.fr', full_name: 'Emma Petit', password: 'seller123' },
  { email: 'hugo@casaone.fr', full_name: 'Hugo Robert', password: 'seller123' },
  { email: 'chloe@casaone.fr', full_name: 'Chloé Richard', password: 'seller123' },
  { email: 'theo@casaone.fr', full_name: 'Théo Moreau', password: 'seller123' },
]

const FIRST_NAMES = [
  'Jean', 'Sophie', 'Antoine', 'Claire', 'Maxime', 'Julie', 'Thomas', 'Camille',
  'Nicolas', 'Léa', 'Alexandre', 'Marine', 'Julien', 'Charlotte', 'Baptiste',
  'Pauline', 'Romain', 'Laura', 'Florian', 'Manon', 'Adrien', 'Sarah', 'Kevin',
  'Audrey', 'Mathieu', 'Anaïs', 'Guillaume', 'Mélanie', 'Vincent', 'Céline',
]

const LAST_NAMES = [
  'Dupont', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Michel', 'Lefebvre', 'Garcia',
  'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André',
]

const CONTACT_CHANNELS = ['whatsapp', 'sms', 'phone', 'email', 'in_store', 'other'] as const

const INTEREST_TAXONOMY = [
  { category: 'fashion', value: 'sneakers' },
  { category: 'fashion', value: 'ready_to_wear' },
  { category: 'fashion', value: 'accessories' },
  { category: 'food', value: 'japanese' },
  { category: 'food', value: 'wine' },
  { category: 'art', value: 'contemporary' },
  { category: 'music', value: 'hip_hop' },
  { category: 'lifestyle', value: 'travel' },
  { category: 'lifestyle', value: 'watches' },
]

const TIER_TARGETS = [
  { tier: 'rainbow', min: 0, max: 999 },
  { tier: 'optimisto', min: 1000, max: 2499 },
  { tier: 'kaizen', min: 2500, max: 9999 },
  { tier: 'idealiste', min: 10000, max: 16999 },
  { tier: 'diplomatico', min: 17000, max: 24999 },
  { tier: 'grand_prix', min: 25000, max: 40000 },
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysAgo: number, daysAgoMax?: number): Date {
  const maxDays = daysAgoMax ?? daysAgo
  const days = randomInt(daysAgo, maxDays)
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

async function createUserWithProfile(
  email: string,
  password: string,
  fullName: string,
  role: 'seller' | 'supervisor'
): Promise<string | null> {
  // Create auth user with metadata so trigger can work
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role,
    },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users?.find(u => u.email === email)
      if (existing) {
        console.log(`User ${email} already exists`)
        return existing.id
      }
    }
    console.error(`Failed to create user ${email}:`, authError.message)
    return null
  }

  const userId = authData.user!.id

  // Manually create profile (since trigger might be failing)
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      full_name: fullName,
      role,
      active: true,
    })

  if (profileError) {
    console.error(`Failed to create profile for ${email}:`, profileError.message)
    return null
  }

  console.log(`Created ${role}: ${email}`)
  return userId
}

async function seed() {
  console.log('Starting seed...\n')

  // Create supervisors
  const supervisorIds: string[] = []
  for (const sup of SUPERVISORS) {
    const id = await createUserWithProfile(sup.email, sup.password, sup.full_name, 'supervisor')
    if (id) supervisorIds.push(id)
  }

  // Create sellers
  const sellerIds: string[] = []
  for (const seller of SELLERS) {
    const id = await createUserWithProfile(seller.email, seller.password, seller.full_name, 'seller')
    if (id) sellerIds.push(id)
  }

  if (sellerIds.length === 0) {
    console.error('\nNo sellers created, cannot seed clients')
    return
  }

  console.log(`\nCreating 50 clients...`)

  // Create 50 clients
  for (let i = 0; i < 50; i++) {
    const sellerId = sellerIds[i % sellerIds.length]
    const tierTarget = randomElement(TIER_TARGETS)
    const targetSpend = randomInt(tierTarget.min, tierTarget.max)

    // Recontact status: 20% overdue, 30% due soon, 50% normal
    const recontactRoll = Math.random()
    let nextRecontactDate: Date
    if (recontactRoll < 0.2) {
      nextRecontactDate = randomDate(1, 14) // Overdue
    } else if (recontactRoll < 0.5) {
      nextRecontactDate = new Date()
      nextRecontactDate.setDate(nextRecontactDate.getDate() + randomInt(0, 3)) // Due soon
    } else {
      nextRecontactDate = new Date()
      nextRecontactDate.setDate(nextRecontactDate.getDate() + randomInt(4, 30)) // Not due
    }

    const firstContactDate = randomDate(90, 365)
    const lastContactDate = randomDate(1, 60)

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        first_name: randomElement(FIRST_NAMES),
        last_name: randomElement(LAST_NAMES),
        email: `client${i + 1}@example.com`,
        phone: `+33 6 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        seller_id: sellerId,
        first_contact_date: firstContactDate.toISOString().split('T')[0],
        last_contact_date: lastContactDate.toISOString().split('T')[0],
        next_recontact_date: nextRecontactDate.toISOString().split('T')[0],
        notes: Math.random() > 0.7 ? 'Client VIP' : null,
      })
      .select()
      .single()

    if (clientError) {
      console.error(`Failed to create client ${i + 1}:`, clientError.message)
      continue
    }

    // Seed purchase if total_spend > 0
    if (targetSpend > 0) {
      await supabase.from('purchases').insert({
        client_id: client.id,
        seller_id: sellerId,
        amount: targetSpend,
        description: 'Initial purchase',
        purchase_date: firstContactDate.toISOString().split('T')[0],
      })
    }

    // Add 1-3 contacts
    const numContacts = randomInt(1, 3)
    for (let j = 0; j < numContacts; j++) {
      await supabase.from('contacts').insert({
        client_id: client.id,
        seller_id: sellerId,
        channel: randomElement(CONTACT_CHANNELS),
        contact_date: randomDate(1, 90).toISOString(),
        comment: Math.random() > 0.5 ? 'Follow-up' : null,
      })
    }

    // Add 1-3 interests
    const numInterests = randomInt(1, 3)
    const shuffledInterests = [...INTEREST_TAXONOMY].sort(() => Math.random() - 0.5)
    for (let j = 0; j < numInterests; j++) {
      await supabase.from('client_interests').insert({
        client_id: client.id,
        category: shuffledInterests[j].category,
        value: shuffledInterests[j].value,
      })
    }

    if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/50 clients created`)
  }

  console.log('\n--- Seed Complete ---')
  console.log(`Supervisors: ${supervisorIds.length}`)
  console.log(`Sellers: ${sellerIds.length}`)
  console.log(`Clients: 50`)
}

seed().catch(console.error)
