import type {
  AuthUser,
  BrandAffinity,
  Client360,
  ClientLocale,
  ClientOrigin,
  ClientSignal,
  ClientTier,
  ContactChannel,
  ContactHistoryItem,
  FashionInterestLevel,
  FirstImpact,
  InterestItem,
  KnownSizeItem,
  NotificationRow,
  NotificationType,
  Profile,
  PurchaseHistoryItem,
  PurchaseSource,
  VisitItem,
} from '@/lib/types'
import type { MeetingFormat, MeetingStatus, MeetingWithDetails } from '@/lib/types/meetings'
import { getSignalPriority } from '@/lib/types/signal'

type SellerSeed = {
  id: string
  email: string
  full_name: string
  role: 'seller' | 'supervisor'
  active: boolean
  city: string
  speciality: string
}

type Affinity = 'tailoring' | 'leather' | 'resort' | 'knitwear' | 'accessories' | 'evening' | 'footwear' | 'outerwear'

type SizeProfile = {
  tops?: string
  bottoms?: string
  outerwear?: string
  shoes?: string
}

type MeetingSeed = {
  dayOffset: number
  hour: number
  durationMinutes: number
  format: MeetingFormat
  status: MeetingStatus
  title: string
  location?: string | null
  outcomeNotes?: string | null
  outcomePurchased?: boolean
}

type ClientSeed = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  seller_id: string
  tier: ClientTier
  locale: ClientLocale
  origin: ClientOrigin
  personal_shopper: boolean
  signal: ClientSignal
  signal_note: string
  heat_score: number
  last_contact_days_ago: number
  cadence_days: number
  relationship_months: number
  birthday: string
  notes: string
  life_notes: string
  affinities: Affinity[]
  life_interests: Array<{ category: string; value: string; detail?: string }>
  size_profile: SizeProfile
  purchase_amounts: number[]
  meeting_plan: MeetingSeed[]
  contact_plan: Array<{ daysAgo: number; channel: ContactChannel; comment: string }>
  visit_plan?: Array<{ daysAgo: number; duration: number; converted: boolean; notes: string; tried_products: string[] }>
}

type SellerSummary = {
  id: string
  name: string
  clientCount: number
  remainingCount: number
  overdueCount: number
  contactsWeek: number
  totalSpend: number
  aJourPct: number
  tiers: Record<ClientTier, number>
}

type ConversionPeriod = 'week' | 'month' | 'all'

type QueueItem = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  tier: ClientTier
  total_spend: number
  last_contact_date: string | null
  next_recontact_date: string | null
  origin: ClientOrigin | null
  is_personal_shopper: boolean
  heat_score: number
  days_overdue: number
  seller_id: string
  seller_name: string
  seller_signal: ClientSignal | null
  signal_note: string | null
  locale: ClientLocale
}

type DemoRecord = {
  client: Client360
  queueItem: QueueItem
  contacts: ContactHistoryItem[]
  purchases: PurchaseHistoryItem[]
  meetings: MeetingWithDetails[]
  visits: VisitItem[]
}

const BOUTIQUE_NAME = 'Maison Serein'
const BOUTIQUE_LOCATION = 'Maison Serein Paris - Avenue Montaigne'
const DEMO_CREATED_AT = '2026-04-13T08:30:00.000Z'
export const DEMO_SUPERVISOR_ID = 'seller-hasael'

export const DEMO_SELLERS: SellerSeed[] = [
  { id: 'seller-hasael', email: 'hasael@maison-serein.demo', full_name: 'Hasael Moussa', role: 'supervisor', active: true, city: 'Paris', speciality: 'VIP wardrobe planning' },
  { id: 'seller-hicham', email: 'hicham@maison-serein.demo', full_name: 'Hicham El Himar', role: 'seller', active: true, city: 'Paris', speciality: 'private appointments' },
  { id: 'seller-elliott', email: 'elliott@maison-serein.demo', full_name: 'Elliott Nowack', role: 'seller', active: true, city: 'Paris', speciality: 'travel wardrobes' },
  { id: 'seller-helen', email: 'helen@maison-serein.demo', full_name: 'Helen Kidane', role: 'seller', active: true, city: 'Paris', speciality: 'emerging VIPs' },
  { id: 'seller-maxime', email: 'maxime@maison-serein.demo', full_name: 'Maxime Hudzevych', role: 'seller', active: true, city: 'Paris', speciality: 'tailoring and leather' },
  { id: 'seller-raphael', email: 'raphael@maison-serein.demo', full_name: 'Raphael Rivera', role: 'seller', active: true, city: 'Paris', speciality: 'international high spend clients' },
  { id: 'seller-yassmine', email: 'yassmine@maison-serein.demo', full_name: 'Yassmine Moutaouakil', role: 'seller', active: true, city: 'Paris', speciality: 'occasion dressing and gifting' },
]

const AFFINITY_LIBRARY: Record<Affinity, { products: string[]; styles: string[]; colors: string[]; materials: string[]; fits: string[]; catalog: Array<{ name: string; category: string; sizeKey: keyof SizeProfile | null }> }> = {
  tailoring: {
    products: ['soft tailoring', 'travel suiting'],
    styles: ['quiet luxury', 'clean line'],
    colors: ['charcoal', 'stone'],
    materials: ['tropical wool', 'cashmere wool'],
    fits: ['clean taper', 'soft shoulder'],
    catalog: [
      { name: 'Fluid double-breasted jacket', category: 'jacket', sizeKey: 'outerwear' },
      { name: 'Travel wool blazer', category: 'jacket', sizeKey: 'outerwear' },
      { name: 'High-rise tailored trouser', category: 'trousers', sizeKey: 'bottoms' },
      { name: 'Ceremony tailoring set', category: 'jacket', sizeKey: 'outerwear' },
    ],
  },
  leather: {
    products: ['structured leather', 'refined bags'],
    styles: ['sleek', 'polished'],
    colors: ['espresso', 'black'],
    materials: ['nappa', 'calfskin'],
    fits: ['precise'],
    catalog: [
      { name: 'Matte calf overshirt', category: 'jacket', sizeKey: 'outerwear' },
      { name: 'Structured leather weekender', category: 'accessories', sizeKey: null },
      { name: 'Soft leather city tote', category: 'accessories', sizeKey: null },
      { name: 'Nappa travel jacket', category: 'jacket', sizeKey: 'outerwear' },
    ],
  },
  resort: {
    products: ['resort sets', 'travel layers'],
    styles: ['destination polish', 'Mediterranean ease'],
    colors: ['sand', 'ocean blue'],
    materials: ['washed silk', 'linen wool'],
    fits: ['easy drape'],
    catalog: [
      { name: 'Washed silk resort shirt', category: 'shirt', sizeKey: 'tops' },
      { name: 'Lightweight travel set', category: 'other', sizeKey: 'tops' },
      { name: 'Linen-blend relaxed trouser', category: 'trousers', sizeKey: 'bottoms' },
      { name: 'Pool-to-dinner knit polo', category: 'knitwear', sizeKey: 'tops' },
    ],
  },
  knitwear: {
    products: ['fine-gauge knitwear', 'cashmere polos'],
    styles: ['refined casual'],
    colors: ['cream', 'navy'],
    materials: ['cashmere cotton', 'merino'],
    fits: ['relaxed polish'],
    catalog: [
      { name: 'Fine-gauge cashmere polo', category: 'knitwear', sizeKey: 'tops' },
      { name: 'Merino travel crew', category: 'knitwear', sizeKey: 'tops' },
      { name: 'Cashmere-cotton cardigan', category: 'knitwear', sizeKey: 'tops' },
      { name: 'Soft zip knit layer', category: 'knitwear', sizeKey: 'tops' },
    ],
  },
  accessories: {
    products: ['small leather goods', 'giftable accessories'],
    styles: ['polished detail'],
    colors: ['bone', 'gold'],
    materials: ['soft leather', 'silk twill'],
    fits: [],
    catalog: [
      { name: 'Hand-finished silk scarf', category: 'accessories', sizeKey: null },
      { name: 'Small structured leather bag', category: 'accessories', sizeKey: null },
      { name: 'Fine leather belt', category: 'accessories', sizeKey: null },
      { name: 'Travel card case', category: 'accessories', sizeKey: null },
    ],
  },
  evening: {
    products: ['occasion separates', 'evening layers'],
    styles: ['soft glamour'],
    colors: ['midnight', 'ivory'],
    materials: ['silk crepe', 'satin'],
    fits: ['waist definition'],
    catalog: [
      { name: 'Satin shawl jacket', category: 'jacket', sizeKey: 'outerwear' },
      { name: 'Silk faille evening trouser', category: 'trousers', sizeKey: 'bottoms' },
      { name: 'Compact evening knit', category: 'knitwear', sizeKey: 'tops' },
      { name: 'Crystal clasp minaudiere', category: 'accessories', sizeKey: null },
    ],
  },
  footwear: {
    products: ['premium footwear', 'dress shoes'],
    styles: ['sharp finish'],
    colors: ['cigar', 'black'],
    materials: ['polished calf'],
    fits: ['true to size'],
    catalog: [
      { name: 'Polished calf loafer', category: 'shoes', sizeKey: 'shoes' },
      { name: 'Soft leather low boot', category: 'shoes', sizeKey: 'shoes' },
      { name: 'Refined travel sneaker', category: 'shoes', sizeKey: 'shoes' },
      { name: 'Evening slingback', category: 'shoes', sizeKey: 'shoes' },
    ],
  },
  outerwear: {
    products: ['structured outerwear', 'city coats'],
    styles: ['long line'],
    colors: ['camel', 'graphite'],
    materials: ['double-face wool', 'cashmere'],
    fits: ['architectural'],
    catalog: [
      { name: 'Cashmere wrap coat', category: 'jacket', sizeKey: 'outerwear' },
      { name: 'Long city overcoat', category: 'jacket', sizeKey: 'outerwear' },
      { name: 'Light structured trench', category: 'jacket', sizeKey: 'outerwear' },
    ],
  },
}

const PURCHASE_SOURCE_ROTATION: PurchaseSource[] = ['casa_one', 'existing_client', 'event', 'casa_one', 'walk_in', 'recommendation']

const CLIENT_SEEDS: ClientSeed[] = [
  {
    id: 'client-amina-rahal',
    first_name: 'Amina',
    last_name: 'Rahal',
    email: 'amina.rahal@private.example',
    phone: '+41 79 552 1440',
    seller_id: 'seller-hasael',
    tier: 'grand_prix',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: true,
    signal: 'very_hot',
    signal_note: 'Travels in Thursday. Wants a polished gala wardrobe with a lighter leather option.',
    heat_score: 96,
    last_contact_days_ago: 9,
    cadence_days: 7,
    relationship_months: 22,
    birthday: '1987-06-12',
    notes: 'Family office principal splitting Geneva, Rabat, and Paris. Buys in complete silhouettes and expects first access before public release.',
    life_notes: 'Collects post-war design, follows Basel calendars closely, and asks for hotel delivery when she lands for one-night stays.',
    affinities: ['tailoring', 'leather', 'evening'],
    life_interests: [
      { category: 'art', value: 'design fairs', detail: 'Prefers private previews' },
      { category: 'travel', value: 'Geneva-Rabat-Paris shuttle' },
      { category: 'business', value: 'family office hospitality' },
    ],
    size_profile: { tops: 'M', bottoms: '40', outerwear: '40', shoes: '39' },
    purchase_amounts: [7200, 5600, 4900, 3800, 2900, 2600],
    meeting_plan: [
      { dayOffset: 2, hour: 16, durationMinutes: 90, format: 'boutique', status: 'scheduled', title: 'Private gala wardrobe preview', location: BOUTIQUE_LOCATION },
      { dayOffset: -14, hour: 15, durationMinutes: 75, format: 'boutique', status: 'completed', title: 'Leather silhouette fitting', outcomePurchased: true, outcomeNotes: 'Reserved look 14 and a second skin belt.' },
    ],
    contact_plan: [
      { daysAgo: 9, channel: 'whatsapp', comment: 'Shared first look on the May gala edit and confirmed she lands Thursday afternoon.' },
      { daysAgo: 24, channel: 'phone', comment: 'Aligned on softer shoulder tailoring and a second option in cocoa leather.' },
      { daysAgo: 43, channel: 'email', comment: 'Sent atelier sketches and private appointment availability before Geneva trip.' },
    ],
    visit_plan: [{ daysAgo: 14, duration: 85, converted: true, notes: 'Pulled full evening wardrobe and alternative shoe block.', tried_products: ['Satin shawl jacket', 'Chocolate leather column skirt'] }],
  },
  {
    id: 'client-julien-delacroix',
    first_name: 'Julien',
    last_name: 'Delacroix',
    email: 'julien.delacroix@private.example',
    phone: '+33 6 18 42 95 40',
    seller_id: 'seller-hasael',
    tier: 'diplomatico',
    locale: 'local',
    origin: 'french',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'Asked for a quieter capsule for board travel and has budget approval for a full drop.',
    heat_score: 88,
    last_contact_days_ago: 5,
    cadence_days: 14,
    relationship_months: 15,
    birthday: '1983-10-04',
    notes: 'Paris-based investor with a preference for understated luxury. Responds fastest to concise WhatsApp curation and values delivery reliability.',
    life_notes: 'Weekend sailing in Brittany, often gifts to his partner, and likes neatly edited looks over broad presentations.',
    affinities: ['tailoring', 'resort', 'accessories'],
    life_interests: [
      { category: 'travel', value: 'Mediterranean weekends' },
      { category: 'sport', value: 'sailing' },
      { category: 'food', value: 'private dining rooms' },
    ],
    size_profile: { tops: 'L', bottoms: '50', outerwear: '50', shoes: '43' },
    purchase_amounts: [5600, 4900, 3700, 2900, 2200],
    meeting_plan: [
      { dayOffset: 5, hour: 11, durationMinutes: 60, format: 'video', status: 'scheduled', title: 'Travel capsule review' },
      { dayOffset: -20, hour: 12, durationMinutes: 45, format: 'call', status: 'completed', title: 'Quarterly wardrobe review', outcomeNotes: 'Approved full travel edit budget.' },
    ],
    contact_plan: [
      { daysAgo: 5, channel: 'whatsapp', comment: 'Sent condensed board-travel capsule with two bag options and a lighter knit layer.' },
      { daysAgo: 19, channel: 'phone', comment: 'Reviewed April travel schedule and confirmed he wants wrinkle-resistant tailoring first.' },
      { daysAgo: 37, channel: 'email', comment: 'Delivered a clean three-look travel proposal with overnight shipping windows.' },
    ],
  },
  {
    id: 'client-sana-al-farsi',
    first_name: 'Sana',
    last_name: 'Al Farsi',
    email: 'sana.alfarsi@private.example',
    phone: '+971 50 440 1298',
    seller_id: 'seller-elliott',
    tier: 'grand_prix',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: true,
    signal: 'very_hot',
    signal_note: 'Flying back to Paris this evening and requested resort pieces to go with last month s leather order.',
    heat_score: 98,
    last_contact_days_ago: 2,
    cadence_days: 7,
    relationship_months: 18,
    birthday: '1990-02-08',
    notes: 'Young collector buying for short intense Paris visits. Strong appetite for private drops, accessories, and coordinated travel looks.',
    life_notes: 'Alternates between Dubai and Paris, attends Formula 1 weekends, and prefers high-energy appointment edits over email decks.',
    affinities: ['resort', 'leather', 'accessories'],
    life_interests: [
      { category: 'travel', value: 'Paris-Dubai shuttle' },
      { category: 'sport', value: 'Formula 1 weekends' },
      { category: 'nightlife', value: 'private member clubs' },
    ],
    size_profile: { tops: 'S', bottoms: '38', outerwear: '38', shoes: '38' },
    purchase_amounts: [8800, 6200, 5400, 4100, 3200],
    meeting_plan: [
      { dayOffset: 0, hour: 18, durationMinutes: 75, format: 'boutique', status: 'scheduled', title: 'Resort capsule pull-through', location: BOUTIQUE_LOCATION },
      { dayOffset: -12, hour: 16, durationMinutes: 60, format: 'whatsapp', status: 'completed', title: 'Accessory follow-up', outcomePurchased: true, outcomeNotes: 'Closed on two travel accessories after same-day message thread.' },
    ],
    contact_plan: [
      { daysAgo: 2, channel: 'whatsapp', comment: 'Confirmed Paris arrival and reserved the bright resort set and leather weekender.' },
      { daysAgo: 11, channel: 'phone', comment: 'Reviewed color direction for summer and moved her appointment earlier on arrival day.' },
      { daysAgo: 29, channel: 'email', comment: 'Shared destination-focused silhouettes for the Cannes and Monza calendar.' },
    ],
  },
  {
    id: 'client-thomas-bernier',
    first_name: 'Thomas',
    last_name: 'Bernier',
    email: 'thomas.bernier@private.example',
    phone: '+33 6 48 62 77 31',
    seller_id: 'seller-elliott',
    tier: 'idealiste',
    locale: 'local',
    origin: 'french',
    personal_shopper: false,
    signal: 'warm',
    signal_note: 'Interested in light tailoring but still comparing timing with his June travel calendar.',
    heat_score: 74,
    last_contact_days_ago: 21,
    cadence_days: 21,
    relationship_months: 11,
    birthday: '1988-11-17',
    notes: 'Founder with a measured buying rhythm. Responds well to practical edits and pieces that flex between office and travel.',
    life_notes: 'Spends long weekends in Lisbon, likes architecture books, and prefers one polished suggestion over a broad selection.',
    affinities: ['tailoring', 'knitwear'],
    life_interests: [
      { category: 'travel', value: 'Lisbon long weekends' },
      { category: 'books', value: 'architecture monographs' },
      { category: 'business', value: 'design-led hospitality' },
    ],
    size_profile: { tops: 'M', bottoms: '48', outerwear: '48', shoes: '42' },
    purchase_amounts: [2800, 2200, 1900, 1600, 1500],
    meeting_plan: [{ dayOffset: -6, hour: 10, durationMinutes: 45, format: 'call', status: 'completed', title: 'Travel tailoring check-in', outcomeNotes: 'Asked to revisit after Lisbon trip.' }],
    contact_plan: [
      { daysAgo: 21, channel: 'email', comment: 'Sent three-piece travel tailoring edit with lighter knit layering options.' },
      { daysAgo: 39, channel: 'phone', comment: 'Reviewed comfort-first fit feedback from his last blazer order.' },
      { daysAgo: 58, channel: 'whatsapp', comment: 'Shared a clean capsule for office-to-airport dressing.' },
    ],
  },
  {
    id: 'client-clara-montrose',
    first_name: 'Clara',
    last_name: 'Montrose',
    email: 'clara.montrose@private.example',
    phone: '+44 7700 912341',
    seller_id: 'seller-helen',
    tier: 'kaizen',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'New London prospect with strong appetite for knitwear and giftable accessories. Wants to see a tighter edit before she commits.',
    heat_score: 83,
    last_contact_days_ago: 4,
    cadence_days: 30,
    relationship_months: 4,
    birthday: '1993-04-22',
    notes: 'Early-stage relationship but high taste level and fast response time. Shopping for herself and occasional partner gifting.',
    life_notes: 'Works in communications, travels to Paris twice a month, and likes short persuasive edits with clear styling logic.',
    affinities: ['knitwear', 'accessories', 'resort'],
    life_interests: [
      { category: 'travel', value: 'London-Paris routine' },
      { category: 'design', value: 'gallery openings' },
      { category: 'food', value: 'chef counters' },
    ],
    size_profile: { tops: 'S', bottoms: '38', outerwear: '38', shoes: '38' },
    purchase_amounts: [1800, 1450, 920],
    meeting_plan: [{ dayOffset: 3, hour: 14, durationMinutes: 45, format: 'video', status: 'scheduled', title: 'Soft summer edit review' }],
    contact_plan: [
      { daysAgo: 4, channel: 'whatsapp', comment: 'Confirmed she wants a narrower knitwear and accessory edit before next Paris stop.' },
      { daysAgo: 17, channel: 'email', comment: 'Shared a compact resort-forward proposal with gifting ideas for her partner.' },
    ],
  },
  {
    id: 'client-gabriel-saad',
    first_name: 'Gabriel',
    last_name: 'Saad',
    email: 'gabriel.saad@private.example',
    phone: '+33 6 95 33 42 12',
    seller_id: 'seller-helen',
    tier: 'idealiste',
    locale: 'local',
    origin: 'french',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'Ready for a leather update and already approved a second footwear option if fit is right.',
    heat_score: 86,
    last_contact_days_ago: 8,
    cadence_days: 21,
    relationship_months: 12,
    birthday: '1985-09-01',
    notes: 'Prefers clean leather pieces and consistent fit memory. Appreciates quick answer cycles and clear product reasoning.',
    life_notes: 'Motor enthusiast, spends weekends between Paris and Deauville, and often buys a second option when sizing is trusted.',
    affinities: ['leather', 'footwear'],
    life_interests: [
      { category: 'cars', value: 'classic touring cars' },
      { category: 'travel', value: 'Deauville weekends' },
      { category: 'watches', value: 'steel sports references' },
    ],
    size_profile: { tops: 'L', bottoms: '50', outerwear: '50', shoes: '44' },
    purchase_amounts: [3200, 2700, 2300, 2100, 1500],
    meeting_plan: [
      { dayOffset: 1, hour: 12, durationMinutes: 60, format: 'boutique', status: 'scheduled', title: 'Leather and loafer fitting', location: BOUTIQUE_LOCATION },
      { dayOffset: -27, hour: 17, durationMinutes: 50, format: 'boutique', status: 'completed', title: 'Outerwear try-on', outcomePurchased: true, outcomeNotes: 'Closed on the suede overshirt after fit adjustments.' },
    ],
    contact_plan: [
      { daysAgo: 8, channel: 'phone', comment: 'Held the espresso overshirt and a second loafer size for tomorrow s fitting.' },
      { daysAgo: 26, channel: 'whatsapp', comment: 'Sent side-by-side leather finishes and narrowed the buy to two pieces.' },
      { daysAgo: 49, channel: 'email', comment: 'Recapped his fit notes and proposed a sharper shoulder outerwear option.' },
    ],
  },
  {
    id: 'client-maya-lambert',
    first_name: 'Maya',
    last_name: 'Lambert',
    email: 'maya.lambert@private.example',
    phone: '+33 6 22 74 13 19',
    seller_id: 'seller-maxime',
    tier: 'optimisto',
    locale: 'local',
    origin: 'french',
    personal_shopper: false,
    signal: 'warm',
    signal_note: 'Small client today but showing strong curiosity around knitwear and elevated basics. Worth nurturing.',
    heat_score: 68,
    last_contact_days_ago: 12,
    cadence_days: 45,
    relationship_months: 3,
    birthday: '1996-12-03',
    notes: 'Early relationship with limited spend but strong response quality. Best prospect for gradual wallet growth through styling confidence.',
    life_notes: 'Works in digital strategy, values texture and color, and reacts well to simple before-after styling guidance.',
    affinities: ['knitwear', 'accessories'],
    life_interests: [{ category: 'technology', value: 'creative tools' }, { category: 'design', value: 'modern interiors' }],
    size_profile: { tops: 'S', bottoms: '38', shoes: '39' },
    purchase_amounts: [690, 520, 410],
    meeting_plan: [{ dayOffset: 6, hour: 18, durationMinutes: 30, format: 'call', status: 'scheduled', title: 'Intro styling follow-up' }],
    contact_plan: [
      { daysAgo: 12, channel: 'whatsapp', comment: 'Shared two knit options under a controlled budget and noted she wants a simple styling walkthrough.' },
      { daysAgo: 28, channel: 'email', comment: 'Thanked her for first purchase and suggested one accessory to complete the look.' },
    ],
  },
  {
    id: 'client-nikolai-zorin',
    first_name: 'Nikolai',
    last_name: 'Zorin',
    email: 'nikolai.zorin@private.example',
    phone: '+44 7700 345118',
    seller_id: 'seller-maxime',
    tier: 'diplomatico',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'Wants a sharper city wardrobe before returning to London. Likely to convert quickly on outerwear and leather.',
    heat_score: 89,
    last_contact_days_ago: 15,
    cadence_days: 14,
    relationship_months: 9,
    birthday: '1981-03-19',
    notes: 'Private equity operator with decisive taste. Prefers rational product edits but spends heavily once convinced on finish and fit.',
    life_notes: 'Moves between London, Paris, and Zurich, values concierge-style service, and appreciates product comparisons with clear argumentation.',
    affinities: ['tailoring', 'leather', 'outerwear'],
    life_interests: [
      { category: 'business', value: 'cross-border deal travel' },
      { category: 'watches', value: 'white metal complications' },
      { category: 'travel', value: 'London-Zurich-Paris shuttle' },
    ],
    size_profile: { tops: 'L', bottoms: '50', outerwear: '52', shoes: '43' },
    purchase_amounts: [4600, 3900, 3500, 3100, 2500],
    meeting_plan: [
      { dayOffset: -1, hour: 9, durationMinutes: 30, format: 'video', status: 'no_show', title: 'City outerwear review', outcomeNotes: 'Assistant asked to reschedule after flight change.' },
      { dayOffset: 2, hour: 13, durationMinutes: 45, format: 'video', status: 'scheduled', title: 'Rescheduled outerwear review' },
    ],
    contact_plan: [
      { daysAgo: 15, channel: 'email', comment: 'Sent a direct outerwear and leather proposal before his Zurich meetings.' },
      { daysAgo: 31, channel: 'phone', comment: 'Compared two coat silhouettes and confirmed he wants the longer line.' },
      { daysAgo: 55, channel: 'whatsapp', comment: 'Shared fit photos and narrowed to two travel tailoring options.' },
    ],
  },
  {
    id: 'client-elise-fournier',
    first_name: 'Elise',
    last_name: 'Fournier',
    email: 'elise.fournier@private.example',
    phone: '+33 6 57 11 90 42',
    seller_id: 'seller-raphael',
    tier: 'idealiste',
    locale: 'local',
    origin: 'french',
    personal_shopper: true,
    signal: 'warm',
    signal_note: 'Still active, but needs a strong point of view for the next eveningwear moment.',
    heat_score: 78,
    last_contact_days_ago: 19,
    cadence_days: 21,
    relationship_months: 14,
    birthday: '1991-07-27',
    notes: 'Trusted on evening dressing and event gifting. Buys selectively but with good average basket when the styling idea lands.',
    life_notes: 'Museum board member, hosts intimate dinners, and likes pieces that shift from event to private supper.',
    affinities: ['evening', 'accessories'],
    life_interests: [
      { category: 'art', value: 'museum patron circles' },
      { category: 'food', value: 'private hosting' },
      { category: 'design', value: 'floral collaborations' },
    ],
    size_profile: { tops: 'S', bottoms: '38', outerwear: '38', shoes: '38' },
    purchase_amounts: [2600, 2200, 2100, 1900, 1700],
    meeting_plan: [{ dayOffset: 4, hour: 17, durationMinutes: 60, format: 'boutique', status: 'scheduled', title: 'Evening dressing appointment', location: BOUTIQUE_LOCATION }],
    contact_plan: [
      { daysAgo: 19, channel: 'whatsapp', comment: 'Sent a concise eveningwear proposition tied to her museum dinner calendar.' },
      { daysAgo: 36, channel: 'email', comment: 'Reserved two accessory options for a hosting look refresh.' },
      { daysAgo: 60, channel: 'phone', comment: 'Closed the conversation around a lighter evening piece for spring events.' },
    ],
  },
  {
    id: 'client-omar-haddad',
    first_name: 'Omar',
    last_name: 'Haddad',
    email: 'omar.haddad@private.example',
    phone: '+971 58 610 4518',
    seller_id: 'seller-raphael',
    tier: 'grand_prix',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: true,
    signal: 'very_hot',
    signal_note: 'Asks for full look planning before diplomatic events and converts quickly once a silhouette is confirmed.',
    heat_score: 97,
    last_contact_days_ago: 1,
    cadence_days: 7,
    relationship_months: 19,
    birthday: '1979-01-25',
    notes: 'Ambassador-level profile requiring private handling and fast turnaround. Strong appetite for full silhouettes, tailoring, and leather travel pieces.',
    life_notes: 'Moves with embassy protocol teams, often buys with gifting in mind, and expects discreet white-glove delivery.',
    affinities: ['leather', 'tailoring', 'footwear'],
    life_interests: [
      { category: 'travel', value: 'protocol travel' },
      { category: 'business', value: 'state hospitality' },
      { category: 'watches', value: 'formal dress watches' },
    ],
    size_profile: { tops: 'L', bottoms: '52', outerwear: '52', shoes: '44' },
    purchase_amounts: [7600, 6200, 5400, 4200, 3100],
    meeting_plan: [
      { dayOffset: 2, hour: 19, durationMinutes: 90, format: 'external', status: 'scheduled', title: 'Residence fitting - diplomatic dinner edit', location: 'Hotel de Crillon suite' },
      { dayOffset: -18, hour: 15, durationMinutes: 60, format: 'boutique', status: 'completed', title: 'Formal wardrobe pull', outcomePurchased: true, outcomeNotes: 'Closed on full monochrome set and travel leather.' },
    ],
    contact_plan: [
      { daysAgo: 1, channel: 'whatsapp', comment: 'Confirmed residence fitting and pre-selected ceremony tailoring with matching footwear.' },
      { daysAgo: 16, channel: 'phone', comment: 'Aligned on diplomatic calendar and reserved the clean monochrome silhouette.' },
      { daysAgo: 40, channel: 'email', comment: 'Sent a private ceremonial wardrobe deck with delivery windows.' },
    ],
  },
  {
    id: 'client-valentina-costa',
    first_name: 'Valentina',
    last_name: 'Costa',
    email: 'valentina.costa@private.example',
    phone: '+39 335 440 1148',
    seller_id: 'seller-yassmine',
    tier: 'diplomatico',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: true,
    signal: 'hot',
    signal_note: 'Preparing Riviera travel and asked for an occasion capsule with elevated gifting options.',
    heat_score: 87,
    last_contact_days_ago: 7,
    cadence_days: 14,
    relationship_months: 10,
    birthday: '1989-08-14',
    notes: 'Italian entrepreneur with strong occasion dressing sensibility. Buys for travel, events, and recurring gift moments.',
    life_notes: 'Splits Milan and Capri, loves hosting, and always asks for one hero piece plus gift-ready accessories.',
    affinities: ['resort', 'evening', 'accessories'],
    life_interests: [
      { category: 'travel', value: 'Capri summers' },
      { category: 'food', value: 'hosting weekends' },
      { category: 'art', value: 'Italian galleries' },
    ],
    size_profile: { tops: 'S', bottoms: '38', outerwear: '38', shoes: '38' },
    purchase_amounts: [4800, 3900, 3400, 2900, 2300],
    meeting_plan: [
      { dayOffset: 1, hour: 15, durationMinutes: 60, format: 'video', status: 'scheduled', title: 'Capri event capsule review' },
      { dayOffset: -25, hour: 16, durationMinutes: 50, format: 'whatsapp', status: 'completed', title: 'Gifting shortlist', outcomePurchased: true, outcomeNotes: 'Closed on gift-ready accessories for a family weekend.' },
    ],
    contact_plan: [
      { daysAgo: 7, channel: 'whatsapp', comment: 'Curated a Riviera capsule and grouped gifting pieces she can confirm remotely.' },
      { daysAgo: 23, channel: 'phone', comment: 'Reviewed event calendar and narrowed the capsule to soft glamour tones.' },
      { daysAgo: 41, channel: 'email', comment: 'Sent a private deck for Capri travel with evening crossover looks.' },
    ],
  },
  {
    id: 'client-arthur-marchand',
    first_name: 'Arthur',
    last_name: 'Marchand',
    email: 'arthur.marchand@private.example',
    phone: '+33 6 78 90 12 24',
    seller_id: 'seller-yassmine',
    tier: 'kaizen',
    locale: 'local',
    origin: 'french',
    personal_shopper: false,
    signal: 'warm',
    signal_note: 'Responds to useful wardrobe logic and could scale into higher value with better fit memory.',
    heat_score: 72,
    last_contact_days_ago: 18,
    cadence_days: 30,
    relationship_months: 8,
    birthday: '1994-05-09',
    notes: 'Growing client with a practical wardrobe brief. Best opportunities come from seasonal refreshes and reliable fit repetition.',
    life_notes: 'Consultant with frequent client dinners, likes clean layering, and is open to a broader proposition when value is visible.',
    affinities: ['tailoring', 'knitwear'],
    life_interests: [
      { category: 'business', value: 'consulting travel' },
      { category: 'food', value: 'client dinners' },
    ],
    size_profile: { tops: 'M', bottoms: '48', outerwear: '48', shoes: '42' },
    purchase_amounts: [1400, 1250, 980],
    meeting_plan: [{ dayOffset: 4, hour: 12, durationMinutes: 30, format: 'call', status: 'scheduled', title: 'Spring refresh follow-up' }],
    contact_plan: [
      { daysAgo: 18, channel: 'email', comment: 'Sent a practical spring refresh with one dinner jacket and two easy knit layers.' },
      { daysAgo: 42, channel: 'phone', comment: 'Checked fit comfort and proposed a cleaner trouser rise.' },
    ],
  },
  {
    id: 'client-leila-benhamou',
    first_name: 'Leila',
    last_name: 'Benhamou',
    email: 'leila.benhamou@private.example',
    phone: '+33 6 11 82 47 51',
    seller_id: 'seller-hicham',
    tier: 'idealiste',
    locale: 'local',
    origin: 'french',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'Ready for a bag and evening-knit update before festival season.',
    heat_score: 84,
    last_contact_days_ago: 6,
    cadence_days: 21,
    relationship_months: 13,
    birthday: '1986-03-30',
    notes: 'Creative producer with good wallet upside. Moves when styling feels editorial but still wearable.',
    life_notes: 'Festival and production calendar drives her wardrobe. Likes compact ideas, backstage practicality, and gift-ready accessories.',
    affinities: ['leather', 'accessories', 'evening'],
    life_interests: [
      { category: 'cinema', value: 'festival circuits' },
      { category: 'music', value: 'backstage production' },
      { category: 'travel', value: 'short production trips' },
    ],
    size_profile: { tops: 'M', bottoms: '40', outerwear: '40', shoes: '39' },
    purchase_amounts: [2600, 2400, 2100, 1900, 1700],
    meeting_plan: [{ dayOffset: 2, hour: 11, durationMinutes: 50, format: 'boutique', status: 'scheduled', title: 'Festival-ready accessory pull', location: BOUTIQUE_LOCATION }],
    contact_plan: [
      { daysAgo: 6, channel: 'whatsapp', comment: 'Reserved the softer oxblood bag and a light evening knit for festival travel.' },
      { daysAgo: 22, channel: 'email', comment: 'Sent a sharp event accessory shortlist and one hero bag option.' },
      { daysAgo: 40, channel: 'phone', comment: 'Aligned on lighter evening silhouettes that still feel editorial.' },
    ],
  },
  {
    id: 'client-samir-azoulay',
    first_name: 'Samir',
    last_name: 'Azoulay',
    email: 'samir.azoulay@private.example',
    phone: '+212 661 440 921',
    seller_id: 'seller-hicham',
    tier: 'diplomatico',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: true,
    signal: 'hot',
    signal_note: 'Seeking two looks for state dinners and already asked for matching travel pieces.',
    heat_score: 90,
    last_contact_days_ago: 10,
    cadence_days: 14,
    relationship_months: 17,
    birthday: '1978-12-11',
    notes: 'Diplomatic-profile client with clear occasion dressing needs. Values privacy, speed, and coherent look planning across multiple events.',
    life_notes: 'Alternates Rabat and Paris, often purchases alongside protocol calendars, and asks for delivery to hotel staff when timing is tight.',
    affinities: ['tailoring', 'evening'],
    life_interests: [
      { category: 'travel', value: 'Rabat-Paris circuit' },
      { category: 'business', value: 'state calendar hosting' },
      { category: 'watches', value: 'dress references' },
    ],
    size_profile: { tops: 'L', bottoms: '52', outerwear: '52', shoes: '44' },
    purchase_amounts: [5300, 4600, 3400, 2900, 1800],
    meeting_plan: [
      { dayOffset: 6, hour: 16, durationMinutes: 75, format: 'boutique', status: 'scheduled', title: 'State dinner wardrobe review', location: BOUTIQUE_LOCATION },
      { dayOffset: -16, hour: 14, durationMinutes: 45, format: 'call', status: 'completed', title: 'Ceremony wardrobe recap', outcomeNotes: 'Confirmed second event budget.' },
    ],
    contact_plan: [
      { daysAgo: 10, channel: 'whatsapp', comment: 'Sent two ceremony-ready looks with matching travel leather options.' },
      { daysAgo: 26, channel: 'phone', comment: 'Discussed protocol calendar and narrowed to a midnight ceremony direction.' },
      { daysAgo: 44, channel: 'email', comment: 'Shared a discreet state-dinner deck and delivery windows.' },
    ],
  },
  {
    id: 'client-ines-keller',
    first_name: 'Ines',
    last_name: 'Keller',
    email: 'ines.keller@private.example',
    phone: '+49 151 8841 2206',
    seller_id: 'seller-hasael',
    tier: 'optimisto',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: false,
    signal: 'cold',
    signal_note: 'Responsive when in Paris, quiet when traveling. Needs a stronger reason to re-engage.',
    heat_score: 55,
    last_contact_days_ago: 47,
    cadence_days: 45,
    relationship_months: 6,
    birthday: '1992-09-09',
    notes: 'Low-spend but aesthetically aligned client. Worth keeping warm through concise, seasonal product triggers rather than generic outreach.',
    life_notes: 'Berlin creative director, comes to Paris around fashion week, and reacts best to one memorable hero piece.',
    affinities: ['accessories', 'footwear'],
    life_interests: [
      { category: 'design', value: 'graphic identity work' },
      { category: 'travel', value: 'fashion week travel' },
    ],
    size_profile: { tops: 'S', bottoms: '36', shoes: '37' },
    purchase_amounts: [780, 560],
    meeting_plan: [{ dayOffset: -2, hour: 12, durationMinutes: 30, format: 'video', status: 'no_show', title: 'Fashion week accessories review', outcomeNotes: 'Travel conflict. Needs reschedule.' }],
    contact_plan: [
      { daysAgo: 47, channel: 'email', comment: 'Sent one focused accessories edit for her next Paris stop.' },
      { daysAgo: 71, channel: 'whatsapp', comment: 'Checked timing for fashion week travel and held one hero piece.' },
    ],
  },
  {
    id: 'client-matteo-vieri',
    first_name: 'Matteo',
    last_name: 'Vieri',
    email: 'matteo.vieri@private.example',
    phone: '+39 335 900 1184',
    seller_id: 'seller-helen',
    tier: 'grand_prix',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'Ready for a major summer buy if footwear and tailoring land in one fitting.',
    heat_score: 92,
    last_contact_days_ago: 6,
    cadence_days: 7,
    relationship_months: 20,
    birthday: '1982-07-06',
    notes: 'Italian hospitality operator with strong appetite for complete summer buys. Responds to decisive fitting moments and clear category authority.',
    life_notes: 'Moves from Milan to Ibiza through the season, hosts frequently, and values speed when he is in town.',
    affinities: ['footwear', 'leather', 'tailoring'],
    life_interests: [
      { category: 'travel', value: 'Milan-Ibiza season' },
      { category: 'food', value: 'hosting-driven wardrobe' },
      { category: 'nightlife', value: 'private tables' },
    ],
    size_profile: { tops: 'L', bottoms: '50', outerwear: '50', shoes: '44' },
    purchase_amounts: [6800, 5900, 4700, 4200, 3300, 2600],
    meeting_plan: [
      { dayOffset: 0, hour: 15, durationMinutes: 90, format: 'boutique', status: 'scheduled', title: 'Summer wardrobe fitting', location: BOUTIQUE_LOCATION },
      { dayOffset: -21, hour: 17, durationMinutes: 60, format: 'boutique', status: 'completed', title: 'Footwear review', outcomePurchased: true, outcomeNotes: 'Closed on two footwear blocks and a travel bag.' },
    ],
    contact_plan: [
      { daysAgo: 6, channel: 'phone', comment: 'Confirmed today s fitting and held three footwear options with matching tailoring.' },
      { daysAgo: 20, channel: 'whatsapp', comment: 'Sent a decisive summer wardrobe shortlist with one travel leather hero piece.' },
      { daysAgo: 43, channel: 'email', comment: 'Shared a hosting-oriented wardrobe plan for the Ibiza stretch.' },
    ],
  },
  {
    id: 'client-yara-salim',
    first_name: 'Yara',
    last_name: 'Salim',
    email: 'yara.salim@private.example',
    phone: '+971 55 220 4711',
    seller_id: 'seller-hicham',
    tier: 'diplomatico',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: true,
    signal: 'warm',
    signal_note: 'High-value client who went quiet after travel season. Strong reactivation candidate with the right event hook.',
    heat_score: 69,
    last_contact_days_ago: 43,
    cadence_days: 28,
    relationship_months: 16,
    birthday: '1984-11-09',
    notes: 'Dormant VIP-type profile with strong historical spend. Needs elevated, relevant outreach rather than generic reminders.',
    life_notes: 'Travels heavily with diplomatic family commitments and re-engages when there is a real event or private-hosting angle.',
    affinities: ['resort', 'accessories', 'evening'],
    life_interests: [
      { category: 'travel', value: 'diplomatic travel calendar' },
      { category: 'food', value: 'private hosting' },
      { category: 'art', value: 'regional patron circles' },
    ],
    size_profile: { tops: 'M', bottoms: '40', outerwear: '40', shoes: '39' },
    purchase_amounts: [4700, 4200, 3600, 3100, 1800],
    meeting_plan: [{ dayOffset: 7, hour: 17, durationMinutes: 45, format: 'video', status: 'scheduled', title: 'VIP reactivation edit' }],
    contact_plan: [
      { daysAgo: 43, channel: 'email', comment: 'Sent one elevated hosting-led proposal instead of a broad seasonal deck.' },
      { daysAgo: 71, channel: 'whatsapp', comment: 'Shared a private event capsule tied to her return to Paris.' },
      { daysAgo: 102, channel: 'phone', comment: 'Recapped preferred silhouettes and noted she would revisit around next travel block.' },
    ],
  },
  {
    id: 'client-daphne-kim',
    first_name: 'Daphne',
    last_name: 'Kim',
    email: 'daphne.kim@private.example',
    phone: '+82 10-4401-1832',
    seller_id: 'seller-helen',
    tier: 'optimisto',
    locale: 'foreign',
    origin: 'foreign',
    personal_shopper: false,
    signal: 'hot',
    signal_note: 'New Seoul-based prospect with unusually fast response speed. Small spend today, strong upside tomorrow.',
    heat_score: 81,
    last_contact_days_ago: 3,
    cadence_days: 45,
    relationship_months: 2,
    birthday: '1997-08-01',
    notes: 'Very new but unusually high-potential. Clear taste, fast response, and open to a bigger buy around her next Paris visit.',
    life_notes: 'Creative brand strategist, follows fashion week closely, and appreciates when Casa One frames the next step clearly.',
    affinities: ['accessories', 'footwear'],
    life_interests: [
      { category: 'travel', value: 'Paris fashion week visits' },
      { category: 'design', value: 'brand image systems' },
      { category: 'technology', value: 'creative software' },
    ],
    size_profile: { tops: 'S', bottoms: '36', shoes: '37' },
    purchase_amounts: [820, 410],
    meeting_plan: [{ dayOffset: 2, hour: 9, durationMinutes: 30, format: 'video', status: 'scheduled', title: 'Paris arrival pre-edit' }],
    contact_plan: [
      { daysAgo: 3, channel: 'whatsapp', comment: 'Prepared a concise arrival edit around one signature shoe and two small leather pieces.' },
      { daysAgo: 18, channel: 'email', comment: 'Welcomed her after first purchase and proposed one stronger next step for Paris.' },
    ],
  },
]

function hashString(input: string): number {
  return Array.from(input).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0)
}

function pickItem<T>(items: T[], seed: string, offset = 0): T {
  return items[(hashString(seed) + offset) % items.length]
}

function addDays(base: Date, days: number, hour = 12, minute = 0): Date {
  const next = new Date(base)
  next.setHours(hour, minute, 0, 0)
  next.setDate(next.getDate() + days)
  return next
}

function toDateOnly(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toIso(date: Date): string {
  return date.toISOString()
}

function startOfDay(date: Date): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function diffInDays(target: string, reference: Date): number {
  return Math.round((startOfDay(reference).getTime() - startOfDay(new Date(target)).getTime()) / 86400000)
}

function firstImpactFromSeed(seed: ClientSeed): FirstImpact {
  const first = seed.purchase_amounts[0] || 0
  if (first >= 2500) return 'flash_entry'
  if (first >= 1000) return 'strong_entry'
  return 'progressive'
}

function fashionInterestFromSeed(seed: ClientSeed): FashionInterestLevel {
  if (seed.tier === 'grand_prix' || seed.tier === 'diplomatico') return 'high'
  if (seed.signal === 'hot' || seed.signal === 'very_hot') return 'high'
  return 'medium'
}

function brandAffinityFromSeed(seed: ClientSeed): BrandAffinity {
  if (seed.tier === 'grand_prix' || seed.tier === 'diplomatico') {
    return {
      client_id: seed.id,
      familiarity: 'vip',
      sensitivity: 'exclusivity_driven',
      purchase_behavior: seed.personal_shopper ? 'collector' : 'frequent',
      contact_preference: 'proactive',
      channel: 'mixed',
    }
  }

  if (seed.tier === 'idealiste') {
    return {
      client_id: seed.id,
      familiarity: 'loyal',
      sensitivity: seed.signal === 'hot' ? 'exclusivity_driven' : 'value_driven',
      purchase_behavior: 'seasonal',
      contact_preference: seed.signal === 'hot' ? 'proactive' : 'reactive',
      channel: 'mixed',
    }
  }

  if (seed.tier === 'kaizen') {
    return {
      client_id: seed.id,
      familiarity: 'regular',
      sensitivity: 'value_driven',
      purchase_behavior: 'occasional',
      contact_preference: 'reactive',
      channel: 'mixed',
    }
  }

  return {
    client_id: seed.id,
    familiarity: 'aware',
    sensitivity: 'value_driven',
    purchase_behavior: 'occasional',
    contact_preference: 'reactive',
    channel: 'online',
  }
}

function sellerById(id: string): SellerSeed {
  const seller = DEMO_SELLERS.find((item) => item.id === id)
  if (!seller) throw new Error(`Unknown seller ${id}`)
  return seller
}

function dedupe(values: string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index)
}

function buildInterestItems(seed: ClientSeed): InterestItem[] {
  const affinityProfiles = seed.affinities.map((affinity) => AFFINITY_LIBRARY[affinity])
  const rows: Array<{ category: string; value: string; domain: 'product' | 'life'; detail?: string }> = [
    ...dedupe(affinityProfiles.flatMap((profile) => profile.products)).map((value) => ({ category: 'products', value, domain: 'product' as const })),
    ...dedupe(affinityProfiles.flatMap((profile) => profile.styles)).map((value) => ({ category: 'styles', value, domain: 'product' as const })),
    ...dedupe(affinityProfiles.flatMap((profile) => profile.colors)).map((value) => ({ category: 'colors', value, domain: 'product' as const })),
    ...dedupe(affinityProfiles.flatMap((profile) => profile.materials)).map((value) => ({ category: 'materials', value, domain: 'product' as const })),
    ...dedupe(affinityProfiles.flatMap((profile) => profile.fits)).map((value) => ({ category: 'fit', value, domain: 'product' as const })),
    ...seed.life_interests.map((interest) => ({ category: interest.category, value: interest.value, domain: 'life' as const, detail: interest.detail })),
  ]

  return rows.map((item, index) => ({
    id: `${seed.id}-interest-${index + 1}`,
    category: item.category,
    value: item.value,
    detail: item.detail ?? null,
    domain: item.domain,
  }))
}

function buildPurchases(seed: ClientSeed, reference: Date): PurchaseHistoryItem[] {
  return seed.purchase_amounts.map((amount, index) => {
    const affinity = seed.affinities[index % seed.affinities.length]
    const selection = pickItem(AFFINITY_LIBRARY[affinity].catalog, `${seed.id}-${affinity}`, index)
    const purchaseDate = addDays(reference, -Math.max(10, seed.last_contact_days_ago + 9 + index * 27), 14, 0)
    const size = selection.sizeKey ? seed.size_profile[selection.sizeKey] || null : null
    return {
      id: `${seed.id}-purchase-${index + 1}`,
      date: toDateOnly(purchaseDate),
      amount,
      description: size ? `${selection.name} - ${size}` : selection.name,
      product_name: selection.name,
      product_category: selection.category,
      size,
      size_type: selection.sizeKey === 'shoes' ? 'EU' : selection.sizeKey ? 'INTL' : null,
      is_gift: seed.personal_shopper && index === seed.purchase_amounts.length - 1,
      gift_recipient: seed.personal_shopper && index === seed.purchase_amounts.length - 1 ? 'inner circle gift' : null,
      source: PURCHASE_SOURCE_ROTATION[index % PURCHASE_SOURCE_ROTATION.length],
    }
  }).sort((a, b) => (a.date < b.date ? 1 : -1))
}

function buildContacts(seed: ClientSeed, reference: Date, sellerName: string): ContactHistoryItem[] {
  return seed.contact_plan.map((entry, index) => ({
    id: `${seed.id}-contact-${index + 1}`,
    date: toDateOnly(addDays(reference, -entry.daysAgo, 11, 0)),
    channel: entry.channel,
    comment: entry.comment,
    seller: sellerName,
  })).sort((a, b) => (a.date < b.date ? 1 : -1))
}

function buildMeetings(seed: ClientSeed, reference: Date, sellerName: string): MeetingWithDetails[] {
  return seed.meeting_plan.map((entry, index) => {
    const start = addDays(reference, entry.dayOffset, entry.hour, 0)
    const end = addDays(reference, entry.dayOffset, entry.hour, entry.durationMinutes)
    return {
      id: `${seed.id}-meeting-${index + 1}`,
      seller_id: seed.seller_id,
      client_id: seed.id,
      title: entry.title,
      description: null,
      format: entry.format,
      location: entry.location ?? null,
      start_time: toIso(start),
      end_time: toIso(end),
      all_day: false,
      status: entry.status,
      outcome_notes: entry.outcomeNotes ?? null,
      outcome_purchased: entry.outcomePurchased ?? false,
      created_at: DEMO_CREATED_AT,
      updated_at: DEMO_CREATED_AT,
      client_name: `${seed.first_name} ${seed.last_name}`,
      client_tier: seed.tier,
      client_phone: seed.phone,
      seller_name: sellerName,
    }
  }).sort((a, b) => (a.start_time > b.start_time ? 1 : -1))
}

function buildVisits(seed: ClientSeed, reference: Date): VisitItem[] {
  return (seed.visit_plan || []).map((entry, index) => ({
    id: `${seed.id}-visit-${index + 1}`,
    date: toDateOnly(addDays(reference, -entry.daysAgo, 15, 0)),
    duration_minutes: entry.duration,
    tried_products: entry.tried_products,
    notes: entry.notes,
    converted: entry.converted,
  }))
}

function buildKnownSizes(seed: ClientSeed, purchases: PurchaseHistoryItem[]): KnownSizeItem[] {
  const categoryMap: Array<{ category: string; key: keyof SizeProfile; sizeType: string }> = [
    { category: 'tops', key: 'tops', sizeType: 'INTL' },
    { category: 'bottoms', key: 'bottoms', sizeType: 'EU' },
    { category: 'outerwear', key: 'outerwear', sizeType: 'INTL' },
    { category: 'shoes', key: 'shoes', sizeType: 'EU' },
  ]

  return categoryMap.filter((item) => seed.size_profile[item.key]).map((item) => ({
    client_id: seed.id,
    category: item.category,
    size: seed.size_profile[item.key] || '',
    size_type: item.sizeType,
    last_product: purchases.find((purchase) => purchase.size === seed.size_profile[item.key])?.product_name || null,
    last_purchase_date: purchases.find((purchase) => purchase.size === seed.size_profile[item.key])?.date || null,
  }))
}

function buildSizing(seed: ClientSeed): Client360['sizing'] {
  const rows: Client360['sizing'] = []
  const push = (category: string, value: string | undefined, system: 'EU' | 'INTL', fit: string | null) => {
    if (!value) return
    rows.push({ id: `${seed.id}-size-${category}`, category, size: value, fit_preference: fit, notes: null, size_system: system })
  }
  push('tops', seed.size_profile.tops, 'INTL', 'clean but easy')
  push('bottoms', seed.size_profile.bottoms, 'EU', 'true to size')
  push('outerwear', seed.size_profile.outerwear, 'INTL', 'light structure')
  push('shoes', seed.size_profile.shoes, 'EU', null)
  return rows
}

function totalSpend(purchases: PurchaseHistoryItem[]): number {
  return purchases.reduce((sum, purchase) => sum + purchase.amount, 0)
}
function buildClientRecord(seed: ClientSeed, reference: Date): DemoRecord {
  const seller = sellerById(seed.seller_id)
  const purchases = buildPurchases(seed, reference)
  const contacts = buildContacts(seed, reference, seller.full_name)
  const meetings = buildMeetings(seed, reference, seller.full_name)
  const visits = buildVisits(seed, reference)
  const firstContact = addDays(reference, -(seed.relationship_months * 30), 10, 0)
  const lastContact = addDays(reference, -seed.last_contact_days_ago, 11, 0)
  const nextRecontact = addDays(lastContact, seed.cadence_days, 11, 0)
  const client: Client360 = {
    id: seed.id,
    first_name: seed.first_name,
    last_name: seed.last_name,
    email: seed.email,
    phone: seed.phone,
    seller_id: seed.seller_id,
    tier: seed.tier,
    total_spend: totalSpend(purchases),
    first_contact_date: toDateOnly(firstContact),
    last_contact_date: toDateOnly(lastContact),
    next_recontact_date: toDateOnly(nextRecontact),
    birthday: seed.birthday,
    notes: seed.notes,
    origin: seed.origin,
    is_personal_shopper: seed.personal_shopper,
    heat_score: seed.heat_score,
    seller_signal: seed.signal,
    signal_note: seed.signal_note,
    signal_updated_at: toIso(lastContact),
    life_notes: seed.life_notes,
    locale: seed.locale,
    first_impact: firstImpactFromSeed(seed),
    interest_in_fashion: fashionInterestFromSeed(seed),
    created_at: DEMO_CREATED_AT,
    updated_at: toIso(addDays(reference, -Math.min(seed.last_contact_days_ago, 2), 9, 0)),
    seller_name: seller.full_name,
    interests: buildInterestItems(seed),
    brand_affinity: brandAffinityFromSeed(seed),
    contact_history: contacts,
    purchase_history: purchases,
    sizing: buildSizing(seed),
    known_sizes: buildKnownSizes(seed, purchases),
    visit_history: visits,
  }
  const queueItem: QueueItem = {
    id: client.id,
    first_name: client.first_name,
    last_name: client.last_name,
    phone: client.phone,
    email: client.email,
    tier: client.tier,
    total_spend: client.total_spend,
    last_contact_date: client.last_contact_date,
    next_recontact_date: client.next_recontact_date,
    origin: client.origin,
    is_personal_shopper: client.is_personal_shopper,
    heat_score: client.heat_score,
    days_overdue: diffInDays(client.next_recontact_date || toDateOnly(reference), reference),
    seller_id: client.seller_id,
    seller_name: client.seller_name,
    seller_signal: client.seller_signal,
    signal_note: client.signal_note,
    locale: client.locale,
  }
  return { client, queueItem, contacts, purchases, meetings, visits }
}

function buildState(reference = new Date()) {
  const records = CLIENT_SEEDS.map((seed) => buildClientRecord(seed, reference))
  return {
    reference,
    records,
    clients: records.map((record) => record.client),
    queue: records.map((record) => record.queueItem).sort((a, b) => {
      const priority = getSignalPriority(a.seller_signal) - getSignalPriority(b.seller_signal)
      if (priority !== 0) return priority
      if (b.days_overdue !== a.days_overdue) return b.days_overdue - a.days_overdue
      return b.total_spend - a.total_spend
    }),
    contacts: records.flatMap((record) => record.contacts),
    purchases: records.flatMap((record) => record.purchases),
    meetings: records.flatMap((record) => record.meetings).sort((a, b) => (a.start_time > b.start_time ? 1 : -1)),
  }
}

function isWithinPeriod(date: string, reference: Date, period: ConversionPeriod): boolean {
  if (period === 'all') return true
  const target = new Date(date)
  const start = new Date(reference)
  start.setHours(0, 0, 0, 0)
  if (period === 'week') start.setDate(start.getDate() - 7)
  else start.setDate(1)
  return target >= start
}

function sellerClientIds(sellerId: string, records: DemoRecord[]) {
  return new Set(records.filter((record) => record.client.seller_id === sellerId).map((record) => record.client.id))
}

export function getDemoAuthUser(effectiveRole: 'seller' | 'supervisor' = 'supervisor'): AuthUser {
  const seller = sellerById(DEMO_SUPERVISOR_ID)
  const profile: Profile = { id: seller.id, email: seller.email, full_name: seller.full_name, role: 'supervisor', active: true, created_at: DEMO_CREATED_AT, updated_at: DEMO_CREATED_AT }
  return { id: seller.id, email: seller.email, profile, effectiveRole }
}

export function getDemoClients() { return buildState().clients }
export function getDemoClientById(id: string) { return buildState().clients.find((client) => client.id === id) || null }
export function getDemoQueue(effectiveRole: 'seller' | 'supervisor', sellerId = DEMO_SUPERVISOR_ID) { const state = buildState(); return effectiveRole === 'seller' ? state.queue.filter((item) => item.seller_id === sellerId) : state.queue }
export function getDemoMeetings(effectiveRole: 'seller' | 'supervisor', sellerId = DEMO_SUPERVISOR_ID) { const state = buildState(); return effectiveRole === 'seller' ? state.meetings.filter((meeting) => meeting.seller_id === sellerId) : state.meetings }
export function getDemoMeetingsForClient(clientId: string) { return buildState().meetings.filter((meeting) => meeting.client_id === clientId) }
export function getDemoSellerRoster() { return DEMO_SELLERS.map((seller) => ({ id: seller.id, full_name: seller.full_name, role: seller.role, active: seller.active, city: seller.city, speciality: seller.speciality })) }

export function getDemoSummary() {
  const state = buildState()
  return {
    totalClients: state.clients.length,
    overdueCount: state.queue.filter((item) => item.days_overdue > 0).length,
    dueTodayCount: state.queue.filter((item) => item.days_overdue === 0).length,
    upcomingCount: state.queue.filter((item) => item.days_overdue < 0).length,
    contactsWeek: state.contacts.filter((contact) => isWithinPeriod(contact.date, state.reference, 'week')).length,
    upcomingMeetings: state.meetings.filter((meeting) => meeting.status === 'scheduled' && new Date(meeting.start_time) > state.reference).length,
  }
}

export function getDemoTierDistribution() {
  const tiers: Record<ClientTier, number> = { rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0 }
  getDemoClients().forEach((client) => { tiers[client.tier] += 1 })
  return tiers
}

export function getDemoHomepageSellerStats(sellerId = DEMO_SUPERVISOR_ID) {
  const state = buildState()
  const clients = state.clients.filter((client) => client.seller_id === sellerId)
  const queue = state.queue.filter((item) => item.seller_id === sellerId)
  const tierCounts: Record<ClientTier, number> = { rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0 }
  clients.forEach((client) => { tierCounts[client.tier] += 1 })
  return {
    totalClients: clients.length,
    remainingCount: queue.length,
    totalSpend: clients.reduce((sum, client) => sum + client.total_spend, 0),
    contactsThisWeek: state.records.filter((record) => record.client.seller_id === sellerId).flatMap((record) => record.contacts).filter((contact) => isWithinPeriod(contact.date, state.reference, 'week')).length,
    tierCounts,
  }
}

export function getDemoRecentContacts(sellerId = DEMO_SUPERVISOR_ID, limit = 5) {
  return buildState().records.filter((record) => record.client.seller_id === sellerId).flatMap((record) => record.contacts.map((contact) => ({ ...contact, client: { id: record.client.id, first_name: record.client.first_name, last_name: record.client.last_name } }))).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, limit)
}

export function getDemoSellerSummaries(): SellerSummary[] {
  const state = buildState()
  return DEMO_SELLERS.map((seller) => {
    const clientIds = sellerClientIds(seller.id, state.records)
    const sellerClients = state.clients.filter((client) => clientIds.has(client.id))
    const sellerQueue = state.queue.filter((item) => item.seller_id === seller.id)
    const overdueCount = sellerQueue.filter((item) => item.days_overdue > 0).length
    const tiers: Record<ClientTier, number> = { rainbow: 0, optimisto: 0, kaizen: 0, idealiste: 0, diplomatico: 0, grand_prix: 0 }
    sellerClients.forEach((client) => { tiers[client.tier] += 1 })
    const contactsWeek = state.records.filter((record) => clientIds.has(record.client.id)).flatMap((record) => record.contacts).filter((contact) => isWithinPeriod(contact.date, state.reference, 'week')).length
    return { id: seller.id, name: seller.full_name, clientCount: sellerClients.length, remainingCount: sellerQueue.length, overdueCount, contactsWeek, totalSpend: sellerClients.reduce((sum, client) => sum + client.total_spend, 0), aJourPct: sellerClients.length === 0 ? 100 : Math.round(((sellerClients.length - overdueCount) / sellerClients.length) * 100), tiers }
  }).filter((seller) => seller.clientCount > 0)
}

export function getDemoNotifications(effectiveRole: 'seller' | 'supervisor') {
  const reference = new Date()
  const queue = getDemoQueue(effectiveRole, DEMO_SUPERVISOR_ID)
  const meetings = getDemoMeetings(effectiveRole, DEMO_SUPERVISOR_ID)
  const urgent = queue.filter((item) => item.days_overdue > 0).slice(0, 4)
  const upcoming = meetings.filter((meeting) => meeting.status === 'scheduled' && new Date(meeting.start_time) > reference).slice(0, 3)
  const notifications: NotificationRow[] = [
    ...urgent.map((item, index) => ({ id: `demo-notification-overdue-${index + 1}`, user_id: DEMO_SUPERVISOR_ID, type: 'client_overdue' as NotificationType, title: `${item.first_name} ${item.last_name} is overdue`, message: `${item.days_overdue} day${item.days_overdue === 1 ? '' : 's'} past cadence. ${item.seller_name} should act.`, client_id: item.id, read: index > 1, due_at: toIso(addDays(reference, -index, 8, 45)), event_key: null, created_at: toIso(addDays(reference, -index, 8, 0)) })),
    ...upcoming.map((meeting, index) => ({ id: `demo-notification-meeting-${index + 1}`, user_id: DEMO_SUPERVISOR_ID, type: 'manual' as NotificationType, title: `Upcoming: ${meeting.client_name}`, message: `${meeting.title} with ${meeting.seller_name}`, client_id: meeting.client_id, read: false, due_at: meeting.start_time, event_key: null, created_at: toIso(addDays(reference, -1, 9, 10 + index)) })),
  ]
  return { notifications: notifications.sort((a, b) => (a.due_at < b.due_at ? 1 : -1)), unread_count: notifications.filter((item) => !item.read).length }
}

export function getDemoSellerImpact(sellerId = DEMO_SUPERVISOR_ID) {
  const state = buildState()
  const sellerPurchases = state.records.filter((record) => record.client.seller_id === sellerId).flatMap((record) => record.purchases).filter((purchase) => isWithinPeriod(purchase.date, state.reference, 'month'))
  const crm = sellerPurchases.filter((purchase) => purchase.source === 'casa_one')
  return { crm_sales: crm.length, crm_revenue: crm.reduce((sum, purchase) => sum + purchase.amount, 0), total_sales: sellerPurchases.length, crm_pct: sellerPurchases.length === 0 ? 0 : Math.round((crm.length / sellerPurchases.length) * 100) }
}

export function getDemoConversion(period: ConversionPeriod) {
  const state = buildState()
  const purchaseToClient = new Map<string, Client360>()
  state.records.forEach((record) => record.purchases.forEach((purchase) => purchaseToClient.set(purchase.id, record.client)))
  const purchases = state.purchases.filter((purchase) => isWithinPeriod(purchase.date, state.reference, period))
  const totalRevenue = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)
  const crm = purchases.filter((purchase) => purchase.source === 'casa_one')
  const bySource = Array.from(new Set(PURCHASE_SOURCE_ROTATION)).map((source) => {
    const scoped = purchases.filter((purchase) => purchase.source === source)
    const revenue = scoped.reduce((sum, purchase) => sum + purchase.amount, 0)
    return { source, count: scoped.length, revenue, avg_basket: scoped.length === 0 ? 0 : Math.round(revenue / scoped.length), pct_of_total: totalRevenue === 0 ? 0 : Math.round((revenue / totalRevenue) * 100) }
  }).filter((item) => item.count > 0)
  const bySeller = DEMO_SELLERS.map((seller) => {
    const scoped = purchases.filter((purchase) => purchaseToClient.get(purchase.id)?.seller_id === seller.id)
    const sellerCrm = scoped.filter((purchase) => purchase.source === 'casa_one')
    return { seller_id: seller.id, seller_name: seller.full_name, total_sales: scoped.length, crm_sales: sellerCrm.length, crm_pct: scoped.length === 0 ? 0 : Math.round((sellerCrm.length / scoped.length) * 100), crm_revenue: sellerCrm.reduce((sum, purchase) => sum + purchase.amount, 0) }
  }).filter((item) => item.total_sales > 0)
  const bySignal = (['very_hot', 'hot', 'warm', 'cold', 'lost', null] as Array<ClientSignal | null>).map((signal) => {
    const clients = state.clients.filter((client) => client.seller_signal === signal)
    const sales = purchases.filter((purchase) => purchaseToClient.get(purchase.id)?.seller_signal === signal)
    const revenue = sales.reduce((sum, purchase) => sum + purchase.amount, 0)
    return { signal, client_count: clients.length, sales_count: sales.length, conversion_pct: clients.length === 0 ? 0 : Math.round((sales.length / clients.length) * 100), avg_basket: sales.length === 0 ? 0 : Math.round(revenue / sales.length) }
  }).filter((item) => item.client_count > 0)
  return { period, by_source: bySource, by_seller: bySeller, by_signal: bySignal, totals: { total_revenue: totalRevenue, crm_revenue: crm.reduce((sum, purchase) => sum + purchase.amount, 0), total_sales: purchases.length, crm_sales: crm.length, conversion_rate: purchases.length === 0 ? 0 : Math.round((crm.length / purchases.length) * 100), avg_crm_basket: crm.length === 0 ? 0 : Math.round(crm.reduce((sum, purchase) => sum + purchase.amount, 0) / crm.length) } }
}

export const DEMO_PRESENTATION_COPY = {
  boutiqueName: BOUTIQUE_NAME,
  positionLine: 'Luxury clienteling, queue intelligence, and supervisor visibility in one operating layer.',
  marker: 'Presentation mode',
}

// ---------------------------------------------------------------------------
// Missed Opportunities demo data
// ---------------------------------------------------------------------------

export type MissedOpportunity = {
  id: string
  created_at: string
  date: string
  seller_id: string | null
  seller_name: string
  client_id: string | null
  result: 'Good' | 'Missed'
  missed_type: string
  description: string
  cause: string
  impact: string
  recommended_action: string
}

const DEMO_MISSED_OPPORTUNITIES: MissedOpportunity[] = [
  {
    id: 'mo-001',
    created_at: '2025-03-10T14:22:00Z',
    date: '2025-03-10',
    seller_id: 'seller-hasael',
    seller_name: 'Hasael Moussa',
    client_id: 'client-julien-delacroix',
    result: 'Missed',
    missed_type: 'Price objection',
    description: 'Client showed strong interest in the Ripple Windbreaker but declined at checkout citing price.',
    cause: 'No price anchoring done earlier in the conversation. Competitor price mentioned by client (Amiri).',
    impact: 'Sale lost. Client left without purchase. Estimated loss: 540 €.',
    recommended_action: 'Prepare price positioning for the Windbreaker on next visit. Lead with value, not price.',
  },
  {
    id: 'mo-002',
    created_at: '2025-03-18T11:05:00Z',
    date: '2025-03-18',
    seller_id: 'seller-elliott',
    seller_name: 'Elliott Nowack',
    client_id: 'client-amina-rahal',
    result: 'Missed',
    missed_type: 'Wrong timing',
    description: 'Client visited between two appointments. Not enough time to present the full eyewear range.',
    cause: 'No prior booking. Walk-in during peak hour. Could not dedicate full attention.',
    impact: 'No sale. Client expressed interest but left to "think about it".',
    recommended_action: 'Follow up within 48h. Propose a dedicated appointment for the eyewear presentation.',
  },
  {
    id: 'mo-003',
    created_at: '2025-04-02T16:40:00Z',
    date: '2025-04-02',
    seller_id: 'seller-hasael',
    seller_name: 'Hasael Moussa',
    client_id: 'client-sana-al-farsi',
    result: 'Good',
    missed_type: 'Client not ready',
    description: 'Client came in to browse, not to buy. Conversation went well. Belt and eyewear noted as future interests.',
    cause: 'First visit. Client in discovery mode.',
    impact: 'No immediate sale but strong first impression. Interests logged.',
    recommended_action: 'Schedule a follow-up in 3 weeks. Reference belt + Memphis eyewear in recontact.',
  },
  {
    id: 'mo-004',
    created_at: '2025-03-22T10:15:00Z',
    date: '2025-03-22',
    seller_id: 'seller-maxime',
    seller_name: 'Maxime Hudzevych',
    client_id: 'client-nikolai-zorin',
    result: 'Missed',
    missed_type: 'No show',
    description: 'Client did not attend the scheduled outerwear video review. His assistant cited a last-minute flight change.',
    cause: 'No confirmation sent 24h in advance. Appointment not locked in the client\'s calendar.',
    impact: 'Outerwear budget window delayed. Risk of losing momentum before his London return.',
    recommended_action: 'Resend the two coat options by email with a clear hold expiry. Confirm new slot directly with the assistant.',
  },
  {
    id: 'mo-005',
    created_at: '2025-04-05T15:30:00Z',
    date: '2025-04-05',
    seller_id: 'seller-helen',
    seller_name: 'Helen Kidane',
    client_id: 'client-gabriel-saad',
    result: 'Missed',
    missed_type: 'Wrong product',
    description: 'Presented a full leather outerwear selection but client had shifted focus to footwear. Mismatch in product angle.',
    cause: 'Last briefing was outerwear. No update captured after his WhatsApp note about the loafer fitting.',
    impact: 'Fitting ran 20 minutes over. Client left without buying. Expressed mild frustration at the mismatch.',
    recommended_action: 'Before next appointment, confirm product focus by message. Prepare footwear primary, outerwear as secondary.',
  },
  {
    id: 'mo-006',
    created_at: '2025-04-08T11:50:00Z',
    date: '2025-04-08',
    seller_id: 'seller-raphael',
    seller_name: 'Raphael Rivera',
    client_id: 'client-elise-fournier',
    result: 'Missed',
    missed_type: 'Wrong timing',
    description: 'Proposed a full evening selection for a gala in three weeks but client had already purchased elsewhere the previous day.',
    cause: 'Recontact was two days late. Another maison reached her first with a targeted proposal.',
    impact: 'Estimated loss: 2,800 €. Client remains warm but window was closed.',
    recommended_action: 'Tighten recontact timing around her event calendar. Flag key dates three weeks out, not one.',
  },
  {
    id: 'mo-007',
    created_at: '2025-04-10T14:00:00Z',
    date: '2025-04-10',
    seller_id: 'seller-hicham',
    seller_name: 'Hicham El Himar',
    client_id: 'client-thomas-bernier',
    result: 'Good',
    missed_type: 'Client not ready',
    description: 'Covered for Elliott during his leave. Client came in for a light check-in, no clear purchase intent. Conversation focused on Lisbon trip tailoring needs.',
    cause: 'Walk-in visit, no prior briefing transferred from Elliott. Worked from client card notes.',
    impact: 'No sale but relationship maintained. Client confirmed interest in a travel blazer on return.',
    recommended_action: 'Brief Elliott on the Lisbon conversation. Prepare a lightweight travel blazer proposal timed to his return date.',
  },
  {
    id: 'mo-008',
    created_at: '2025-04-12T17:20:00Z',
    date: '2025-04-12',
    seller_id: 'seller-yassmine',
    seller_name: 'Yassmine Moutaouakil',
    client_id: 'client-clara-montrose',
    result: 'Missed',
    missed_type: 'Price objection',
    description: 'Client was interested in a gift set combining the CC belt and eyewear but hesitated at combined price. Left without deciding.',
    cause: 'No gifting bundle framing offered. Items were presented separately. Total felt larger than expected.',
    impact: 'No sale. Gift occasion window (partner\'s birthday) may have passed.',
    recommended_action: 'For next gifting moment, present curated pairs with a combined narrative, not individual pricing. Prepare a gift card option.',
  },
]

export function getDemoMissedOpportunities(clientId?: string): MissedOpportunity[] {
  if (clientId) {
    return DEMO_MISSED_OPPORTUNITIES.filter((mo) => mo.client_id === clientId)
  }
  return DEMO_MISSED_OPPORTUNITIES
}
