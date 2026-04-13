import { createClient } from '@supabase/supabase-js'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type Tier = 'rainbow' | 'optimisto' | 'kaizen' | 'idealiste' | 'diplomatico' | 'grand_prix'
type Signal = 'very_hot' | 'hot' | 'warm' | 'cold' | 'lost'
type Locale = 'local' | 'foreign'
type FashionInterest = 'low' | 'medium' | 'high'
type MeetingFormat = 'boutique' | 'external' | 'call' | 'video' | 'whatsapp'
type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show'

type ProfileRow = {
  id: string
  email: string
  full_name: string
  role: 'seller' | 'supervisor'
}

type DemoUserMap = {
  supervisor: ProfileRow
  seller: ProfileRow
}

const SUPERVISOR_EMAIL = process.env.DEMO_SUPERVISOR_EMAIL || 'julane.moussa@casaone.com'
const SELLER_EMAIL = process.env.DEMO_SELLER_EMAIL || 'hasael.moussa@casaone.fr'
const CLIENT_COUNT = 48

const FIRST_NAMES = [
  'Adele', 'Adrien', 'Amina', 'Arthur', 'Aya', 'Bastien', 'Camille', 'Clara', 'Damien', 'Diane', 'Elias', 'Elodie',
  'Emma', 'Ethan', 'Farah', 'Gabriel', 'Hugo', 'Ines', 'Iris', 'Jade', 'Julian', 'Lea', 'Leon', 'Lina',
  'Louis', 'Lucie', 'Malo', 'Manon', 'Mila', 'Nael', 'Nina', 'Noah', 'Nora', 'Oscar', 'Pia', 'Rania',
  'Raphael', 'Sacha', 'Salome', 'Sarah', 'Sofia', 'Theo', 'Victoria', 'Yanis', 'Yara', 'Zoe', 'Amelie', 'Matteo',
]

const LAST_NAMES = [
  'Aubry', 'Barbier', 'Bardot', 'Benali', 'Caron', 'Charvet', 'Chevalier', 'Collet', 'Dargent', 'Delacroix', 'Dumas', 'Fabre',
  'Fournier', 'Garcia', 'Garnier', 'Giraud', 'Klein', 'Lambert', 'Leroux', 'Levy', 'Marchand', 'Martin', 'Mercier', 'Meunier',
  'Meyer', 'Morel', 'Navarro', 'Perrin', 'Renard', 'Renaud', 'Rossi', 'Roux', 'Sanchez', 'Schmitt', 'Simon', 'Valette',
]

const LIFE_NOTES = [
  'Travels frequently between Paris and Milan and responds best to precise product edits rather than broad lookbooks.',
  'Prefers a quiet in-store appointment before major travel and often asks for one backup option in a second size.',
  'Values discretion, quick WhatsApp follow-up, and pieces that transition from daytime hosting to dinner.',
  'Buys with strong visual conviction, especially when styling is presented as a complete silhouette instead of separate items.',
  'Often purchases gifts for a partner and reacts well to curated suggestions tied to upcoming travel or events.',
  'Collects standout pieces slowly and remembers prior fit notes in detail, especially around jackets and trousers.',
]

const SIGNAL_NOTES: Record<Signal, string[]> = {
  very_hot: [
    'Reserved two looks and confirmed a fitting window this week.',
    'Asked for private preview pieces before the next delivery lands.',
  ],
  hot: [
    'Responded positively to the latest edit and wants a shortlist.',
    'Considering a wardrobe refresh around upcoming travel.',
  ],
  warm: [
    'Engaged recently but still comparing timing and priorities.',
    'Open to outreach when the right silhouette arrives.',
  ],
  cold: [
    'Interest exists but momentum has slowed after the last contact.',
    'Needs a stronger reason to re-engage than a generic new-arrivals message.',
  ],
  lost: [
    'No near-term action expected; keep memory but deprioritize cadence.',
    'Relationship is dormant and should stay out of the active queue for now.',
  ],
}

const CONTACT_COMMENTS = [
  'Reviewed a short edit focused on travel-ready tailoring.',
  'Confirmed preferred fit and held two options for comparison.',
  'Shared a focused WhatsApp edit built around recent purchases.',
  'Called ahead of a city visit to prepare a fitting room.',
  'Sent a thank-you note after in-store appointment.',
  'Checked in on sizing after the last purchase.',
]

const INTEREST_GROUPS = {
  Products: ['Silk shirts', 'Knitwear', 'Tailoring', 'Sneakers', 'Outerwear', 'Accessories'],
  Collections: ['Tennis Club', 'Maison De Reve', 'Gradient Wave', 'Monogram', 'Night Palm'],
  Colors: ['Forest', 'Ivory', 'Chocolate', 'Navy', 'Gold', 'Black'],
  Styles: ['Relaxed tailoring', 'Graphic statement', 'Soft layering', 'Travel wardrobe', 'Evening polish'],
}

const BRAND_AFFINITY = {
  familiarity: ['aware', 'regular', 'loyal', 'vip'],
  sensitivity: ['value_driven', 'exclusivity_driven', 'price_sensitive'],
  purchase_behavior: ['occasional', 'seasonal', 'frequent', 'collector'],
  contact_preference: ['reactive', 'proactive', 'passive'],
  channel: ['in_store', 'mixed', 'online'],
}

const PRODUCT_CATALOG = [
  { name: 'Fluid travel jacket', category: 'jacket', sizeType: 'number', prices: [890, 1150, 1450] },
  { name: 'Silk print shirt', category: 'shirt', sizeType: 'letter', prices: [420, 520, 640] },
  { name: 'Cashmere polo knit', category: 'knitwear', sizeType: 'letter', prices: [360, 460, 620] },
  { name: 'Relaxed pleated trouser', category: 'trousers', sizeType: 'number', prices: [410, 520, 690] },
  { name: 'Leather weekender', category: 'accessories', sizeType: 'letter', prices: [780, 980, 1250] },
  { name: 'Court sneaker', category: 'shoes', sizeType: 'shoe', prices: [430, 520, 610] },
]

const SIZE_BY_CATEGORY: Record<string, { size_system: 'EU' | 'US' | 'UK' | 'INTL'; values: string[]; fit: string[] }> = {
  knitwear: { size_system: 'INTL', values: ['S', 'M', 'L', 'XL'], fit: ['clean but easy', 'relaxed', 'true to size'] },
  shirts: { size_system: 'INTL', values: ['S', 'M', 'L', 'XL'], fit: ['true to size', 'easy shoulder', 'slightly relaxed'] },
  jackets: { size_system: 'EU', values: ['46', '48', '50', '52', '54'], fit: ['structured', 'easy shoulder', 'slim but comfortable'] },
  pants: { size_system: 'US', values: ['29', '30', '31', '32', '33', '34'], fit: ['true to size', 'clean break', 'relaxed rise'] },
  shoes: { size_system: 'EU', values: ['40', '41', '42', '43', '44', '45'], fit: ['true to size', 'half size up with socks'] },
}

const TIER_TARGETS: Record<Tier, { min: number; max: number; purchases: [number, number] }> = {
  rainbow: { min: 180, max: 900, purchases: [0, 1] },
  optimisto: { min: 1100, max: 2400, purchases: [1, 2] },
  kaizen: { min: 2800, max: 9800, purchases: [2, 3] },
  idealiste: { min: 10500, max: 16500, purchases: [3, 4] },
  diplomatico: { min: 17500, max: 24500, purchases: [4, 5] },
  grand_prix: { min: 28000, max: 52000, purchases: [5, 6] },
}

function pick<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function chance(probability: number): boolean {
  return Math.random() < probability
}

function toDateKey(value: Date): string {
  return value.toISOString().split('T')[0]
}

function addDays(base: Date, offset: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + offset)
  return next
}

function buildPhone(): string {
  return `+33 6 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`
}

function buildEmail(firstName: string, lastName: string, index: number): string {
  const normalized = `${firstName}.${lastName}.${index + 1}`.toLowerCase().replace(/[^a-z0-9.]/g, '')
  return `${normalized}@example-demo.casa`
}

function tierForIndex(index: number): Tier {
  if (index < 2) return 'grand_prix'
  if (index < 6) return 'diplomatico'
  if (index < 14) return 'idealiste'
  if (index < 28) return 'kaizen'
  if (index < 38) return 'optimisto'
  return 'rainbow'
}

function signalForTier(tier: Tier): Signal {
  const weighted: Record<Tier, Signal[]> = {
    grand_prix: ['very_hot', 'hot', 'hot', 'warm'],
    diplomatico: ['hot', 'hot', 'warm', 'warm'],
    idealiste: ['hot', 'warm', 'warm', 'cold'],
    kaizen: ['warm', 'warm', 'cold', 'cold'],
    optimisto: ['warm', 'cold', 'cold', 'lost'],
    rainbow: ['cold', 'cold', 'lost', 'warm'],
  }
  return pick(weighted[tier])
}

function fashionInterestForSignal(signal: Signal): FashionInterest {
  if (signal === 'very_hot' || signal === 'hot') return pick(['high', 'high', 'medium'])
  if (signal === 'warm') return pick(['medium', 'high', 'low'])
  return pick(['low', 'medium'])
}

function cadenceDays(tier: Tier, signal: Signal, locale: Locale): number {
  const baseByTier: Record<Tier, number> = {
    grand_prix: 7,
    diplomatico: 14,
    idealiste: 21,
    kaizen: 30,
    optimisto: 45,
    rainbow: 60,
  }
  const signalMultiplier: Record<Signal, number> = {
    very_hot: 0.5,
    hot: 1,
    warm: 1,
    cold: 1.5,
    lost: 3,
  }
  const localeMultiplier = locale === 'foreign' ? 2 : 1
  return Math.max(3, Math.round(baseByTier[tier] * signalMultiplier[signal] * localeMultiplier))
}

async function getDemoUsers(): Promise<DemoUserMap> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .in('email', [SUPERVISOR_EMAIL, SELLER_EMAIL])

  if (error) throw error

  const supervisor = (data || []).find((row) => row.email === SUPERVISOR_EMAIL)
  const seller = (data || []).find((row) => row.email === SELLER_EMAIL)

  if (!supervisor || !seller) {
    throw new Error('Demo users not found. Run scripts/create-demo-users.ts first.')
  }

  return {
    supervisor: supervisor as ProfileRow,
    seller: seller as ProfileRow,
  }
}

async function clearExistingDemoData(userIds: string[]) {
  const { data: demoClients, error: clientFetchError } = await supabase
    .from('clients')
    .select('id')
    .eq('is_demo', true)

  if (clientFetchError) throw clientFetchError

  const demoClientIds = (demoClients || []).map((row) => row.id)

  if (demoClientIds.length > 0) {
    await supabase.from('meetings').delete().in('client_id', demoClientIds)
    await supabase.from('visits').delete().in('client_id', demoClientIds)
    await supabase.from('client_sizing').delete().in('client_id', demoClientIds)
    await supabase.from('client_brand_affinity').delete().in('client_id', demoClientIds)
    await supabase.from('purchases').delete().in('client_id', demoClientIds)
    await supabase.from('contacts').delete().in('client_id', demoClientIds)
    await supabase.from('client_interests').delete().in('client_id', demoClientIds)
    await supabase.from('notifications').delete().in('client_id', demoClientIds)
    await supabase.from('clients').delete().in('id', demoClientIds)
  }

  await supabase.from('notifications').delete().in('user_id', userIds).like('event_key', 'demo-%')
}

async function seed() {
  const users = await getDemoUsers()
  await clearExistingDemoData([users.supervisor.id, users.seller.id])

  const demoClientIds: string[] = []
  const now = new Date()

  for (let index = 0; index < CLIENT_COUNT; index += 1) {
    const tier = tierForIndex(index)
    const signal = signalForTier(tier)
    const locale: Locale = chance(0.28) ? 'foreign' : 'local'
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length]
    const lastName = LAST_NAMES[(index * 3) % LAST_NAMES.length]
    const firstContactDate = addDays(now, -randomInt(45, 220))
    const lastContactDate = addDays(now, -randomInt(0, 40))
    const nextRecontactDate = addDays(lastContactDate, cadenceDays(tier, signal, locale) - randomInt(0, 8))
    const signalNote = pick(SIGNAL_NOTES[signal])
    const interestInFashion = fashionInterestForSignal(signal)
    const isPersonalShopper = tier === 'grand_prix' || (tier === 'diplomatico' && chance(0.35))
    const meetingFormats: MeetingFormat[] = ['boutique', 'call', 'video', 'whatsapp', 'external']

    const purchaseCountRange = TIER_TARGETS[tier].purchases
    const purchaseCount = randomInt(purchaseCountRange[0], purchaseCountRange[1])
    const purchaseRows: Array<Record<string, unknown>> = []
    let totalSpend = 0

    for (let purchaseIndex = 0; purchaseIndex < purchaseCount; purchaseIndex += 1) {
      const product = pick(PRODUCT_CATALOG)
      const amount = product.prices[randomInt(0, product.prices.length - 1)]
      totalSpend += amount
      purchaseRows.push({
        seller_id: users.seller.id,
        amount,
        description: `${product.name} selected during private edit`,
        purchase_date: toDateKey(addDays(now, -randomInt(2, 160))),
        source: pick(['casa_one', 'existing_client', 'recommendation', 'event', 'walk_in']),
        product_name: product.name,
        product_category: product.category,
        size: product.sizeType === 'letter' ? pick(['S', 'M', 'L', 'XL']) : product.sizeType === 'number' ? pick(['46', '48', '50', '52']) : pick(['40', '41', '42', '43', '44']),
        size_type: product.sizeType,
        is_gift: chance(0.12),
        gift_recipient: chance(0.12) ? pick(['partner', 'husband', 'wife', 'friend', 'brother']) : null,
      })
    }

    while (totalSpend < TIER_TARGETS[tier].min) {
      const amount = randomInt(350, 1200)
      totalSpend += amount
      purchaseRows.push({
        seller_id: users.seller.id,
        amount,
        description: 'Follow-up purchase from curated shortlist',
        purchase_date: toDateKey(addDays(now, -randomInt(2, 140))),
        source: pick(['casa_one', 'existing_client', 'recommendation']),
        product_name: pick(PRODUCT_CATALOG).name,
        product_category: pick(['shirt', 'knitwear', 'accessories', 'shoes']),
        size: pick(['S', 'M', 'L', '42', '43']),
        size_type: pick(['letter', 'number', 'shoe']),
        is_gift: false,
        gift_recipient: null,
      })
    }

    const firstPurchaseAmount = Number(purchaseRows[0]?.amount || 0)
    const firstImpact = firstPurchaseAmount >= 2500 ? 'flash_entry' : firstPurchaseAmount >= 1000 ? 'strong_entry' : 'progressive'

    const { data: insertedClient, error: clientInsertError } = await supabase
      .from('clients')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: buildEmail(firstName, lastName, index),
        phone: buildPhone(),
        seller_id: users.seller.id,
        tier,
        total_spend: totalSpend,
        first_contact_date: toDateKey(firstContactDate),
        last_contact_date: toDateKey(lastContactDate),
        next_recontact_date: toDateKey(nextRecontactDate),
        birthday: chance(0.7) ? `198${randomInt(0, 9)}-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}` : null,
        notes: '[demo] Writable demo client',
        origin: locale === 'foreign' ? 'foreign' : 'french',
        is_personal_shopper: isPersonalShopper,
        is_demo: true,
        seller_signal: signal,
        signal_note: signalNote,
        signal_updated_at: addDays(now, -randomInt(0, 12)).toISOString(),
        life_notes: pick(LIFE_NOTES),
        locale,
        first_impact: firstImpact,
        interest_in_fashion: interestInFashion,
      } as any)
      .select('id, first_name, last_name')
      .single()

    if (clientInsertError || !insertedClient) {
      throw clientInsertError || new Error('Failed to insert demo client')
    }

    demoClientIds.push(insertedClient.id)

    const interestRows = Object.entries(INTEREST_GROUPS).flatMap(([category, values]) => {
      const picks = values.sort(() => Math.random() - 0.5).slice(0, randomInt(1, 2))
      return picks.map((value) => ({
        client_id: insertedClient.id,
        category,
        value,
        detail: chance(0.3) ? 'High response rate when this appears in a curated edit.' : null,
        domain: category === 'Products' ? 'product' : 'life',
      }))
    })

    const sizingRows = Object.entries(SIZE_BY_CATEGORY).slice(0, randomInt(3, 5)).map(([category, config]) => ({
      client_id: insertedClient.id,
      category,
      size: pick(config.values),
      fit_preference: pick(config.fit),
      notes: chance(0.25) ? 'Prefers a little room when trying a new fabrication.' : null,
      size_system: config.size_system,
    }))

    const contactCount = randomInt(2, 6)
    const contactRows = Array.from({ length: contactCount }, (_, contactIndex) => ({
      client_id: insertedClient.id,
      seller_id: users.seller.id,
      channel: pick(['whatsapp', 'phone', 'email', 'in_store']),
      contact_date: addDays(lastContactDate, -contactIndex * randomInt(5, 18)).toISOString(),
      comment: pick(CONTACT_COMMENTS),
    }))

    const visitRows = chance(0.55)
      ? [{
          client_id: insertedClient.id,
          seller_id: users.seller.id,
          visit_date: addDays(now, -randomInt(1, 60)).toISOString(),
          duration_minutes: pick([30, 45, 60, 75]),
          tried_products: [pick(PRODUCT_CATALOG).name, pick(PRODUCT_CATALOG).name],
          notes: 'Private fitting with focused selection prepared in advance.',
          converted: chance(0.7),
        }]
      : []

    const brandAffinityRow = {
      client_id: insertedClient.id,
      familiarity: pick(BRAND_AFFINITY.familiarity),
      sensitivity: pick(BRAND_AFFINITY.sensitivity),
      purchase_behavior: pick(BRAND_AFFINITY.purchase_behavior),
      contact_preference: pick(BRAND_AFFINITY.contact_preference),
      channel: pick(BRAND_AFFINITY.channel),
    }

    const meetingCount = chance(0.45) ? randomInt(1, 2) : 0
    const meetingRows = Array.from({ length: meetingCount }, (_, meetingIndex) => {
      const start = addDays(now, randomInt(-3, 10))
      start.setHours(pick([10, 11, 14, 15, 17]), pick([0, 15, 30, 45]), 0, 0)
      const end = new Date(start)
      end.setMinutes(end.getMinutes() + pick([30, 45, 60]))
      const status: MeetingStatus = start < now ? pick(['completed', 'no_show', 'scheduled']) : 'scheduled'
      return {
        seller_id: users.seller.id,
        client_id: insertedClient.id,
        title: `${meetingIndex === 0 ? 'Private appointment' : 'Follow-up fitting'} - ${insertedClient.first_name} ${insertedClient.last_name}`,
        description: 'Prepared around recent purchases, known sizes, and current signal.',
        format: pick(meetingFormats),
        location: 'Casa One Demo Suite - Avenue Montaigne',
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        all_day: false,
        status,
        outcome_notes: status === 'completed' ? 'Client reacted well to the focused edit and requested a hold on one option.' : null,
        outcome_purchased: status === 'completed' ? chance(0.4) : false,
      }
    })

    const notificationRows = [
      {
        user_id: users.seller.id,
        type: signal === 'lost' ? 'manual' : 'client_overdue',
        title: signal === 'lost' ? `Keep memory: ${insertedClient.first_name} ${insertedClient.last_name}` : `${insertedClient.first_name} ${insertedClient.last_name} needs follow-up`,
        message: signal === 'lost' ? 'Dormant relationship kept for memory, not active cadence.' : 'Client is inside the writable demo queue and ready for action.',
        client_id: insertedClient.id,
        read: chance(0.35),
        due_at: addDays(now, randomInt(-6, 3)).toISOString(),
        event_key: `demo-${insertedClient.id}-seller`,
      },
      {
        user_id: users.supervisor.id,
        type: totalSpend >= 5000 ? 'big_purchase' : 'manual',
        title: totalSpend >= 5000 ? `High-value client watch: ${insertedClient.first_name} ${insertedClient.last_name}` : `Portfolio visibility: ${insertedClient.first_name} ${insertedClient.last_name}`,
        message: totalSpend >= 5000 ? 'Useful for supervisor visibility during demo walkthroughs.' : 'Included so the supervisor inbox is visibly active.',
        client_id: insertedClient.id,
        read: chance(0.5),
        due_at: addDays(now, randomInt(-4, 5)).toISOString(),
        event_key: `demo-${insertedClient.id}-supervisor`,
      },
    ]

    const purchaseInsert = purchaseRows.map((row) => ({ ...row, client_id: insertedClient.id }))

    const steps = [
      supabase.from('client_interests').insert(interestRows as any),
      supabase.from('client_sizing').insert(sizingRows as any),
      supabase.from('contacts').insert(contactRows as any),
      supabase.from('purchases').insert(purchaseInsert as any),
      supabase.from('client_brand_affinity').upsert(brandAffinityRow as any, { onConflict: 'client_id' }),
    ]

    if (visitRows.length > 0) {
      steps.push(supabase.from('visits').insert(visitRows as any))
    }

    if (meetingRows.length > 0) {
      steps.push(supabase.from('meetings').insert(meetingRows as any))
    }

    steps.push(supabase.from('notifications').insert(notificationRows as any))

    for (const step of steps) {
      const { error } = await step
      if (error) throw error
    }
  }

  const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_demo', true)
  const { count: contactCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).in('client_id', demoClientIds)
  const { count: purchaseCount } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).in('client_id', demoClientIds)
  const { count: meetingCount } = await supabase.from('meetings').select('*', { count: 'exact', head: true }).in('client_id', demoClientIds)
  const { count: notificationCount } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).like('event_key', 'demo-%')

  console.log('Demo backend seed complete')
  console.log(`Supervisor: ${users.supervisor.full_name} <${users.supervisor.email}>`)
  console.log(`Seller: ${users.seller.full_name} <${users.seller.email}>`)
  console.log(`Demo clients: ${clientCount || 0}`)
  console.log(`Contacts: ${contactCount || 0}`)
  console.log(`Purchases: ${purchaseCount || 0}`)
  console.log(`Meetings: ${meetingCount || 0}`)
  console.log(`Notifications: ${notificationCount || 0}`)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
