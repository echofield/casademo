/**
 * Update Passwords Script
 * Updates passwords for existing users.
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

type UserCredential = {
  email: string
  full_name: string
  password_env: string
}

function requireSecret(envName: string): string {
  const value = process.env[envName]
  if (!value) {
    console.error(`Missing required env var: ${envName}`)
    process.exit(1)
  }
  return value
}

const SUPERVISORS: UserCredential[] = [
  {
    email: 'julane.moussa@casablancaparis.com',
    full_name: 'Hasael Moussa',
    password_env: 'CASABLANCA_PASSWORD_HASAEL',
  },
  {
    email: 'hicham.elhimar@casablancaparis.com',
    full_name: 'Hicham EL Himar',
    password_env: 'CASABLANCA_PASSWORD_HICHAM',
  },
]

const CASABLANCA_TEAM: UserCredential[] = [
  {
    email: 'elliott.nowack@casablancaparis.com',
    full_name: 'Elliott Nowack',
    password_env: 'CASABLANCA_PASSWORD_ELLIOTT',
  },
  {
    email: 'helen.kidane@casablancaparis.com',
    full_name: 'Helen Kidane',
    password_env: 'CASABLANCA_PASSWORD_HELEN',
  },
  {
    email: 'maxime.hudzevych@casablancaparis.com',
    full_name: 'Maxime Hudzevych',
    password_env: 'CASABLANCA_PASSWORD_MAXIME',
  },
  {
    email: 'raphael.rivera@casablancaparis.com',
    full_name: 'Raphael Rivera',
    password_env: 'CASABLANCA_PASSWORD_RAPHAEL',
  },
  {
    email: 'yassmine.moutaouakil@casablancaparis.com',
    full_name: 'Yassmine Moutaouakil',
    password_env: 'CASABLANCA_PASSWORD_YASSMINE',
  },
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

async function updatePassword(row: UserCredential) {
  if (!cachedUsers) cachedUsers = await getAllAuthUsers()
  const user = cachedUsers.find((u) => u.email?.toLowerCase() === row.email.toLowerCase())

  if (!user) {
    console.log(`NOT FOUND: ${row.email} (${row.full_name})`)
    return { success: false }
  }

  const password = requireSecret(row.password_env)
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  })

  if (error) {
    console.error(`FAILED: ${row.email} - ${error.message}`)
    return { success: false }
  }

  console.log(`UPDATED: ${row.full_name} <${row.email}>`)
  return { success: true }
}

async function main() {
  console.log('='.repeat(60))
  console.log('UPDATING USER PASSWORDS')
  console.log('='.repeat(60))
  console.log()

  let updated = 0
  let failed = 0

  console.log('--- Supervisors ---')
  for (const row of SUPERVISORS) {
    const result = await updatePassword(row)
    if (result.success) updated++
    else failed++
  }

  console.log('\n--- Sellers ---')
  for (const row of CASABLANCA_TEAM) {
    const result = await updatePassword(row)
    if (result.success) updated++
    else failed++
  }

  console.log()
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Updated: ${updated}`)
  console.log(`Failed:  ${failed}`)
}

main().catch(console.error)
