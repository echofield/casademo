/**
 * Creates auth users + profiles for every seller name that appears in
 * data/casablanca/clients_clean.csv (Casablanca Faubourg cleanup).
 * Run once before: npm run import:casablanca
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
 * PRODUCTION CREDENTIALS — FILL IN BEFORE RUNNING
 * ============================================================================
 * Replace 'REAL_EMAIL' and 'REAL_PASSWORD' with actual credentials.
 * DO NOT commit real passwords to git. Consider using environment variables
 * or a separate .credentials.json file (git-ignored) for production.
 * ============================================================================
 */

/** Supervisors */
const SUPERVISORS: Array<{ email: string; full_name: string; password: string }> = [
  { email: 'julane.moussa@casablancaparis.com', full_name: 'Hasael Moussa', password: 'Lifecasaway26' },
  { email: 'hicham.elhimar@casablancaparis.com', full_name: 'Hicham EL Himar', password: 'Casaovervision26' },
]

/** Sellers (full_name must match CSV `seller` column exactly) */
const CASABLANCA_TEAM: Array<{ email: string; full_name: string; password: string }> = [
  { email: 'elliott.nowack@casablancaparis.com', full_name: 'Elliott Nowack', password: 'elliott1993casablanca' },
  { email: 'helen.kidane@casablancaparis.com', full_name: 'Helen Kidane', password: 'Cropit2003' },
  { email: 'julane.moussa@casablancaparis.com', full_name: 'Hasael Moussa', password: 'Lifecasaway26' },
  { email: 'maxime.hudzevych@casablancaparis.com', full_name: 'Maxime Hudzevych', password: 'Dyakuyumax26' },
  { email: 'raphael.rivera@casablancaparis.com', full_name: 'Raphael Rivera', password: 'Badbunnybaby93' },
  { email: 'yassmine.moutaouakil@casablancaparis.com', full_name: 'Yassmine Moutaouakil', password: 'Casayass26' },
]

const supervisorEmails = new Set(SUPERVISORS.map(s => s.email.toLowerCase()))

async function ensureUser(row: typeof CASABLANCA_TEAM[0], role: 'seller' | 'supervisor' = 'seller') {
  // Supervisors who are also sellers keep the supervisor role
  const effectiveRole = supervisorEmails.has(row.email.toLowerCase()) ? 'supervisor' : role

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: row.email,
    password: row.password,
    email_confirm: true,
    user_metadata: {
      full_name: row.full_name,
      role: effectiveRole,
    },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = list?.users?.find((u) => u.email?.toLowerCase() === row.email.toLowerCase())
      if (existing) {
        await supabase
          .from('profiles')
          .upsert({
            id: existing.id,
            email: row.email,
            full_name: row.full_name,
            role: effectiveRole,
            active: true,
          })
        console.log(`Exists (synced profile): ${row.email} [${effectiveRole}]`)
        return
      }
    }
    console.error(`Failed ${row.email}:`, authError.message)
    return
  }

  const userId = authData.user!.id
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email: row.email,
    full_name: row.full_name,
    role: effectiveRole,
    active: true,
  })

  if (profileError) {
    console.error(`Profile ${row.email}:`, profileError.message)
    return
  }
  console.log(`Created: ${row.full_name} <${row.email}> [${effectiveRole}]`)
}

async function main() {
  console.log('Seeding Casablanca team...\n')

  console.log('--- Supervisors ---')
  for (const row of SUPERVISORS) {
    await ensureUser(row, 'supervisor')
  }

  console.log('\n--- Sellers ---')
  for (const row of CASABLANCA_TEAM) {
    await ensureUser(row, 'seller')
  }

  console.log('\nDone. Set real passwords in Supabase Auth if needed.')
}

main().catch(console.error)
