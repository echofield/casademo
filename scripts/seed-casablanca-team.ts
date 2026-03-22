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

/** Supervisors */
const SUPERVISORS: Array<{ email: string; full_name: string; password: string }> = [
  { email: 'julane.moussa@casaone.fr', full_name: 'Hasael Moussa', password: 'casablanca-supervisor' },
  { email: 'hicham.elhimar@casaone.fr', full_name: 'Hicham EL Himar', password: 'casablanca-supervisor' },
]

/** Sellers (full_name must match CSV `seller` column exactly) */
const CASABLANCA_TEAM: Array<{ email: string; full_name: string; password: string }> = [
  { email: 'elliott.nowack@casaone.fr', full_name: 'Elliott Nowack', password: 'casablanca-seller' },
  { email: 'hamza.said@casaone.fr', full_name: 'Hamza Said', password: 'casablanca-seller' },
  { email: 'helen.kidane@casaone.fr', full_name: 'Helen Kidane', password: 'casablanca-seller' },
  { email: 'julane.moussa@casaone.fr', full_name: 'Hasael Moussa', password: 'casablanca-seller' }, // Also supervisor
  { email: 'maxime.hudzevych@casaone.fr', full_name: 'Maxime Hudzevych', password: 'casablanca-seller' },
  { email: 'raphael.rivera@casaone.fr', full_name: 'Raphael Rivera', password: 'casablanca-seller' },
  { email: 'ryan.jackson@casaone.fr', full_name: 'Ryan Jackson', password: 'casablanca-seller' },
  { email: 'yassmine.moutaouakil@casaone.fr', full_name: 'Yassmine Moutaouakil', password: 'casablanca-seller' },
]

async function ensureUser(row: typeof CASABLANCA_TEAM[0], role: 'seller' | 'supervisor' = 'seller') {
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: row.email,
    password: row.password,
    email_confirm: true,
    user_metadata: {
      full_name: row.full_name,
      role,
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
            role,
            active: true,
          })
        console.log(`Exists (synced profile): ${row.email}`)
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
    role,
    active: true,
  })

  if (profileError) {
    console.error(`Profile ${row.email}:`, profileError.message)
    return
  }
  console.log(`Created: ${row.full_name} <${row.email}>`)
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
