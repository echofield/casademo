/**
 * Update Passwords Script
 * Updates passwords for existing users who were seeded with placeholder passwords.
 *
 * Run: npm run update:passwords
 */
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

/**
 * ============================================================================
 * PRODUCTION CREDENTIALS - FILL IN BEFORE RUNNING
 * ============================================================================
 * Replace 'REAL_EMAIL' and 'REAL_PASSWORD' with actual credentials.
 * ============================================================================
 */

const SUPERVISORS: Array<{ email: string; full_name: string; password: string }> = [
  { email: 'julane.moussa@casablancaparis.com', full_name: 'Hasael Moussa', password: 'Lifecasaway26' },
  { email: 'hicham.elhimar@casablancaparis.com', full_name: 'Hicham EL Himar', password: 'Casaovervision26' },
]

const CASABLANCA_TEAM: Array<{ email: string; full_name: string; password: string }> = [
  { email: 'elliott.nowack@casablancaparis.com', full_name: 'Elliott Nowack', password: 'elliott1993casablanca' },
  { email: 'helen.kidane@casablancaparis.com', full_name: 'Helen Kidane', password: 'Cropit2003' },
  { email: 'maxime.hudzevych@casablancaparis.com', full_name: 'Maxime Hudzevych', password: 'Dyakuyumax26' },
  { email: 'raphael.rivera@casablancaparis.com', full_name: 'Raphael Rivera', password: 'Badbunnybaby93' },
  { email: 'yassmine.moutaouakil@casablancaparis.com', full_name: 'Yassmine Moutaouakil', password: 'Casayass26' },
]

const ALL_USERS = [...SUPERVISORS, ...CASABLANCA_TEAM]

async function getAllAuthUsers() {
  const all: Array<{ id: string; email?: string }> = []
  let page = 1
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (!data?.users?.length) break
    all.push(...data.users)
    if (data.users.length < 1000) break
    page++
  }
  return all
}

let cachedUsers: Array<{ id: string; email?: string }> | null = null

async function updatePassword(row: typeof ALL_USERS[0]) {
  if (row.email === 'REAL_EMAIL' || row.password === 'REAL_PASSWORD') {
    console.log(`SKIPPED (placeholder): ${row.full_name}`)
    return { success: false, skipped: true }
  }

  if (!cachedUsers) cachedUsers = await getAllAuthUsers()
  const user = cachedUsers.find((u) => u.email?.toLowerCase() === row.email.toLowerCase())

  if (!user) {
    console.log(`NOT FOUND: ${row.email} (${row.full_name})`)
    return { success: false, skipped: false }
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: row.password,
    email_confirm: true,
  })

  if (error) {
    console.error(`FAILED: ${row.email} - ${error.message}`)
    return { success: false, skipped: false }
  }

  console.log(`UPDATED: ${row.full_name} <${row.email}>`)
  return { success: true, skipped: false }
}

async function main() {
  console.log('='.repeat(60))
  console.log('UPDATING USER PASSWORDS')
  console.log('='.repeat(60))
  console.log()

  // Check for placeholder values
  const hasPlaceholders = ALL_USERS.some(
    u => u.email === 'REAL_EMAIL' || u.password === 'REAL_PASSWORD'
  )

  if (hasPlaceholders) {
    console.log('WARNING: Some users have placeholder credentials.')
    console.log('Please fill in real emails and passwords before running.')
    console.log()
  }

  let updated = 0
  let skipped = 0
  let failed = 0

  console.log('--- Supervisors ---')
  for (const row of SUPERVISORS) {
    const result = await updatePassword(row)
    if (result.success) updated++
    else if (result.skipped) skipped++
    else failed++
  }

  console.log('\n--- Sellers ---')
  for (const row of CASABLANCA_TEAM) {
    const result = await updatePassword(row)
    if (result.success) updated++
    else if (result.skipped) skipped++
    else failed++
  }

  console.log()
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped} (placeholders)`)
  console.log(`Failed:  ${failed}`)
}

main().catch(console.error)
