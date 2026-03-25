/**
 * CASA ONE — Data Alignment Verification
 *
 * Compares source CSV against Supabase database.
 * Reports: missing clients, name mismatches, phone mismatches, email mismatches.
 * Priority: phone numbers for WhatsApp.
 *
 * Usage:
 *   npm run verify:data              # Full verification + phone fix
 *   npm run verify:data -- --dry-run # Report only, no fixes
 */
import { config } from 'dotenv'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─────────────────────────────────────────────────────────────────────────────
// PHONE NUMBER UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

/** Strip spaces, dashes, dots, parentheses from phone number */
function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\.\(\)]/g, '')
}

/** Check if phone is in clean WhatsApp format (+XX... with only digits after +) */
function isCleanFormat(phone: string): boolean {
  if (!phone.startsWith('+')) return false
  const afterPlus = phone.slice(1)
  return /^\d+$/.test(afterPlus)
}

/** Convert phone to WhatsApp URL format (no +, no spaces) */
function toWhatsAppNumber(phone: string): string {
  const clean = cleanPhone(phone)
  return clean.startsWith('+') ? clean.slice(1) : clean
}

/** Check if phone number is valid (reasonable length, mostly digits) */
function isValidPhone(phone: string): { valid: boolean; reason?: string } {
  const clean = cleanPhone(phone)
  const digitsOnly = clean.replace(/^\+/, '')

  if (digitsOnly.length < 8) {
    return { valid: false, reason: 'too_short' }
  }
  if (digitsOnly.length > 15) {
    return { valid: false, reason: 'too_long' }
  }
  if (!/^\d+$/.test(digitsOnly)) {
    return { valid: false, reason: 'contains_letters' }
  }
  return { valid: true }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  // Basic email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

type CsvRow = Record<string, string | undefined>

function findColumn(row: CsvRow, field: string): string | undefined {
  const aliases: Record<string, string[]> = {
    first_name: ['first_name', 'firstname', 'prenom', 'prénom'],
    last_name: ['last_name', 'lastname', 'nom', 'name'],
    email: ['email', 'mail', 'e-mail'],
    phone: ['phone', 'telephone', 'tel', 'téléphone', 'mobile'],
    seller: ['seller', 'vendeur', 'sales_rep', 'commercial'],
    tier: ['tier', 'niveau', 'segment'],
    total_spend: ['total_spend', 'total_achats', 'total', 'montant'],
  }

  const keys = aliases[field] || [field]
  for (const key of keys) {
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toLowerCase().trim() === key.toLowerCase()) {
        const v = row[rowKey]
        return v === undefined ? undefined : String(v).trim() || undefined
      }
    }
  }
  return undefined
}

function isEmptyName(name: string | undefined): boolean {
  if (!name) return true
  const lower = name.toLowerCase().trim()
  return lower === '#n/a' || lower === 'n/a' || lower === 'na' || lower === '0' || lower === ''
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

interface DbClient {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  seller_id: string
  tier: string
  notes: string | null
  is_demo?: boolean
}

interface DbProfile {
  id: string
  full_name: string
  email: string
  active: boolean
}

interface VerificationReport {
  // Row counts
  csvRowCount: number
  dbRowCount: number

  // Names
  nameMatched: number
  nameMismatched: Array<{ csv: string; db: string; email?: string; phone?: string }>
  missingInDb: Array<{ first: string; last: string; email?: string; phone?: string }>
  naInCsv: number

  // Phones
  withPhone: number
  withoutPhone: number
  cleanFormat: number
  needsCleanup: number
  invalidPhone: Array<{ id: string; name: string; phone: string; reason: string }>
  phonesFixed: number
  noPhoneClients: Array<{ name: string; seller: string }>

  // Emails
  withEmail: number
  withoutEmail: number
  invalidEmail: Array<{ id: string; name: string; email: string }>

  // Seller assignments
  validSeller: number
  orphanedClients: Array<{ id: string; name: string; seller_id: string }>

  // Tier distribution
  tierCounts: Record<string, number>
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  console.log('═══════════════════════════════════════════════════════════════')
  console.log('         CASA ONE — DATA ALIGNMENT VERIFICATION')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will fix phones)'}`)
  console.log('')

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Load source CSV
  // ─────────────────────────────────────────────────────────────────────────

  const csvPaths = [
    process.env.CASABLANCA_CSV,
    'C:\\Users\\echof\\Desktop\\casblanca\\cleanup_output\\clients_clean.csv',
    path.join(process.cwd(), 'data', 'casablanca', 'clients_clean.csv'),
  ].filter(Boolean) as string[]

  let csvPath: string | null = null
  for (const p of csvPaths) {
    if (existsSync(p)) {
      csvPath = p
      break
    }
  }

  if (!csvPath) {
    console.error('Source CSV not found. Checked:')
    csvPaths.forEach(p => console.error(`  - ${p}`))
    process.exit(1)
  }

  console.log(`Source CSV: ${csvPath}`)

  const csvText = readFileSync(csvPath, 'utf-8')
  const { data: csvRows, errors: parseErrors } = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (parseErrors.length > 0) {
    console.error('CSV parse errors:', parseErrors.slice(0, 5))
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Load database data
  // ─────────────────────────────────────────────────────────────────────────

  console.log('Loading database data...')

  // Fetch all clients with pagination to avoid default 1000 row limit
  const allClients: DbClient[] = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data: batch, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, phone, seller_id, tier, notes')
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) {
      console.error('Failed to load clients:', error.message)
      process.exit(1)
    }

    if (!batch || batch.length === 0) break
    allClients.push(...(batch as DbClient[]))
    if (batch.length < pageSize) break
    page++
  }

  const dbClients = allClients
  const clientsErr = null

  if (clientsErr) {
    console.error('Failed to load clients:', clientsErr.message)
    process.exit(1)
  }

  const { data: dbProfiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, full_name, email, active')

  if (profilesErr) {
    console.error('Failed to load profiles:', profilesErr.message)
    process.exit(1)
  }

  // Build profile lookup
  const activeProfiles = new Set((dbProfiles as DbProfile[]).filter(p => p.active).map(p => p.id))
  const profileNames = new Map((dbProfiles as DbProfile[]).map(p => [p.id, p.full_name]))

  // Filter out demo clients (check notes for demo marker)
  const realClients = (dbClients as DbClient[]).filter(c => {
    if (c.notes?.includes('[demo]')) return false
    return true
  })

  console.log(`Loaded ${realClients.length} real clients from DB`)
  console.log('')

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Build report
  // ─────────────────────────────────────────────────────────────────────────

  const report: VerificationReport = {
    csvRowCount: csvRows.length,
    dbRowCount: realClients.length,
    nameMatched: 0,
    nameMismatched: [],
    missingInDb: [],
    naInCsv: 0,
    withPhone: 0,
    withoutPhone: 0,
    cleanFormat: 0,
    needsCleanup: 0,
    invalidPhone: [],
    phonesFixed: 0,
    noPhoneClients: [],
    withEmail: 0,
    withoutEmail: 0,
    invalidEmail: [],
    validSeller: 0,
    orphanedClients: [],
    tierCounts: {},
  }

  // Build DB lookup by email and phone
  const dbByEmail = new Map<string, DbClient>()
  const dbByPhone = new Map<string, DbClient>()

  for (const client of realClients) {
    if (client.email) dbByEmail.set(client.email.toLowerCase(), client)
    if (client.phone) {
      // Store with cleaned format for matching
      const cleaned = cleanPhone(client.phone)
      dbByPhone.set(cleaned, client)
      dbByPhone.set(client.phone, client) // Also store original
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3.1: Name alignment check (CSV vs DB)
  // ─────────────────────────────────────────────────────────────────────────

  console.log('Checking name alignment...')

  for (const row of csvRows) {
    const csvFirst = findColumn(row, 'first_name')
    const csvLast = findColumn(row, 'last_name')
    const csvEmail = findColumn(row, 'email')
    const csvPhone = findColumn(row, 'phone')

    // Count #N/A rows
    if (isEmptyName(csvFirst) && isEmptyName(csvLast)) {
      report.naInCsv++
    }

    // Try to find matching client in DB
    let dbClient: DbClient | undefined

    if (csvEmail) {
      dbClient = dbByEmail.get(csvEmail.toLowerCase())
    }
    if (!dbClient && csvPhone) {
      const cleanedPhone = cleanPhone(csvPhone)
      dbClient = dbByPhone.get(cleanedPhone) || dbByPhone.get(csvPhone)
    }

    if (!dbClient) {
      // Missing in DB
      if (!isEmptyName(csvFirst) || !isEmptyName(csvLast)) {
        report.missingInDb.push({
          first: csvFirst || '#N/A',
          last: csvLast || '#N/A',
          email: csvEmail,
          phone: csvPhone,
        })
      }
      continue
    }

    // Check name match
    const csvFullName = `${csvFirst || ''} ${csvLast || ''}`.trim().toLowerCase()
    const dbFullName = `${dbClient.first_name} ${dbClient.last_name}`.trim().toLowerCase()

    if (csvFullName && csvFullName !== dbFullName && !isEmptyName(csvFirst)) {
      // Name mismatch - but only report if CSV has a real name
      report.nameMismatched.push({
        csv: `${csvFirst || ''} ${csvLast || ''}`.trim(),
        db: `${dbClient.first_name} ${dbClient.last_name}`.trim(),
        email: csvEmail,
        phone: csvPhone,
      })
    } else {
      report.nameMatched++
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3.2: Phone number audit (CRITICAL for WhatsApp)
  // ─────────────────────────────────────────────────────────────────────────

  console.log('Auditing phone numbers...')

  const phonesToFix: Array<{ id: string; original: string; cleaned: string }> = []

  for (const client of realClients) {
    if (client.phone) {
      report.withPhone++

      // Check if already clean format
      if (isCleanFormat(client.phone)) {
        report.cleanFormat++
      } else {
        report.needsCleanup++

        // Check if valid
        const validation = isValidPhone(client.phone)
        if (!validation.valid) {
          report.invalidPhone.push({
            id: client.id,
            name: `${client.first_name} ${client.last_name}`,
            phone: client.phone,
            reason: validation.reason!,
          })
        } else {
          // Can be fixed
          const cleaned = cleanPhone(client.phone)
          if (cleaned !== client.phone) {
            phonesToFix.push({
              id: client.id,
              original: client.phone,
              cleaned,
            })
          }
        }
      }
    } else {
      report.withoutPhone++
      const sellerName = profileNames.get(client.seller_id) || 'Unknown Seller'
      report.noPhoneClients.push({
        name: `${client.first_name} ${client.last_name}`,
        seller: sellerName,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3.3: Fix phone numbers in DB
  // ─────────────────────────────────────────────────────────────────────────

  if (!dryRun && phonesToFix.length > 0) {
    console.log(`Fixing ${phonesToFix.length} phone numbers...`)

    for (const fix of phonesToFix) {
      const { error } = await supabase
        .from('clients')
        .update({ phone: fix.cleaned })
        .eq('id', fix.id)

      if (error) {
        console.error(`Failed to fix phone for ${fix.id}: ${error.message}`)
      } else {
        report.phonesFixed++
      }
    }
  } else if (dryRun && phonesToFix.length > 0) {
    console.log(`Would fix ${phonesToFix.length} phone numbers (dry run)`)
    report.phonesFixed = phonesToFix.length // Report what would be fixed
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3.4: Email audit
  // ─────────────────────────────────────────────────────────────────────────

  console.log('Auditing emails...')

  for (const client of realClients) {
    if (client.email) {
      report.withEmail++
      if (!isValidEmail(client.email)) {
        report.invalidEmail.push({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          email: client.email,
        })
      }
    } else {
      report.withoutEmail++
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3.5: Seller assignment check
  // ─────────────────────────────────────────────────────────────────────────

  console.log('Checking seller assignments...')

  for (const client of realClients) {
    if (activeProfiles.has(client.seller_id)) {
      report.validSeller++
    } else {
      report.orphanedClients.push({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        seller_id: client.seller_id,
      })
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3.6: Tier distribution
  // ─────────────────────────────────────────────────────────────────────────

  for (const client of realClients) {
    const tier = client.tier || 'rainbow'
    report.tierCounts[tier] = (report.tierCounts[tier] || 0) + 1
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Print report
  // ─────────────────────────────────────────────────────────────────────────

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')
  console.log('                      VERIFICATION REPORT')
  console.log('═══════════════════════════════════════════════════════════════')

  console.log('')
  console.log('ROW COUNT')
  console.log(`  Source CSV:    ${report.csvRowCount}`)
  console.log(`  Database:      ${report.dbRowCount}`)
  console.log(`  Delta:         ${report.dbRowCount - report.csvRowCount}`)

  console.log('')
  console.log('NAMES')
  console.log(`  Matched:       ${report.nameMatched}`)
  console.log(`  Mismatched:    ${report.nameMismatched.length}`)
  if (report.nameMismatched.length > 0) {
    console.log('    First 10:')
    report.nameMismatched.slice(0, 10).forEach(m => {
      console.log(`      CSV: "${m.csv}" → DB: "${m.db}"`)
    })
  }
  console.log(`  Missing in DB: ${report.missingInDb.length}`)
  if (report.missingInDb.length > 0) {
    console.log('    First 10:')
    report.missingInDb.slice(0, 10).forEach(m => {
      console.log(`      "${m.first} ${m.last}" (${m.email || m.phone || 'no contact'})`)
    })
  }
  console.log(`  #N/A in CSV:   ${report.naInCsv}`)

  console.log('')
  console.log('PHONES (WhatsApp priority)')
  const phonePct = ((report.withPhone / report.dbRowCount) * 100).toFixed(1)
  console.log(`  With phone:    ${report.withPhone} / ${report.dbRowCount} (${phonePct}%)`)
  console.log(`  Clean format:  ${report.cleanFormat}`)
  console.log(`  ${dryRun ? 'Would fix' : 'Fixed'}:        ${report.phonesFixed}`)
  console.log(`  Invalid:       ${report.invalidPhone.length}`)
  if (report.invalidPhone.length > 0) {
    console.log('    Details:')
    report.invalidPhone.slice(0, 10).forEach(p => {
      console.log(`      ${p.name}: "${p.phone}" (${p.reason})`)
    })
  }
  console.log(`  No phone:      ${report.withoutPhone}`)
  if (report.noPhoneClients.length > 0) {
    console.log('    First 20 (names + sellers):')
    report.noPhoneClients.slice(0, 20).forEach(c => {
      console.log(`      ${c.name} → ${c.seller}`)
    })
  }

  console.log('')
  console.log('EMAILS')
  const emailPct = ((report.withEmail / report.dbRowCount) * 100).toFixed(1)
  console.log(`  With email:    ${report.withEmail} / ${report.dbRowCount} (${emailPct}%)`)
  console.log(`  No email:      ${report.withoutEmail}`)
  console.log(`  Invalid format:${report.invalidEmail.length}`)
  if (report.invalidEmail.length > 0) {
    report.invalidEmail.slice(0, 5).forEach(e => {
      console.log(`      ${e.name}: "${e.email}"`)
    })
  }

  console.log('')
  console.log('SELLER ASSIGNMENTS')
  console.log(`  Valid:         ${report.validSeller}`)
  console.log(`  Orphaned:      ${report.orphanedClients.length}`)
  if (report.orphanedClients.length > 0) {
    console.log('    All orphaned:')
    report.orphanedClients.forEach(c => {
      console.log(`      ${c.name} (seller_id: ${c.seller_id})`)
    })
  }

  console.log('')
  console.log('TIER DISTRIBUTION')
  const tierOrder = ['rainbow', 'optimisto', 'kaizen', 'idealiste', 'diplomatico', 'grand_prix']
  for (const tier of tierOrder) {
    const count = report.tierCounts[tier] || 0
    const label = tier.charAt(0).toUpperCase() + tier.slice(1)
    console.log(`  ${label.padEnd(12)} ${count}`)
  }

  console.log('')
  console.log('═══════════════════════════════════════════════════════════════')

  // Summary status
  const issues: string[] = []
  if (report.orphanedClients.length > 0) issues.push(`${report.orphanedClients.length} orphaned clients`)
  if (report.invalidPhone.length > 0) issues.push(`${report.invalidPhone.length} invalid phones`)
  if (report.invalidEmail.length > 0) issues.push(`${report.invalidEmail.length} invalid emails`)
  if (report.missingInDb.length > 10) issues.push(`${report.missingInDb.length} missing from DB`)

  if (issues.length === 0) {
    console.log('STATUS: OK - Data alignment verified')
  } else {
    console.log(`STATUS: ATTENTION NEEDED - ${issues.join(', ')}`)
  }

  console.log('═══════════════════════════════════════════════════════════════')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
