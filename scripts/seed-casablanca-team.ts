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

type TeamCredential = {
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

/**
 * Passwords must be supplied through environment variables.
 * Example: CASABLANCA_PASSWORD_HASAEL=... npm run seed:casablanca-team
 */
const SUPERVISORS: TeamCredential[] = [
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

/** Sellers (full_name must match CSV `seller` column exactly) */
const CASABLANCA_TEAM: TeamCredential[] = [
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
    email: 'julane.moussa@casablancaparis.com',
    full_name: 'Hasael Moussa',
    password_env: 'CASABLANCA_PASSWORD_HASAEL',
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

const supervisorEmails = new Set(SUPERVISORS.map(s => s.email.toLowerCase()))

async function ensureUser(row: TeamCredential, role: 'seller' | 'supervisor' = 'seller') {
  const password = requireSecret(row.password_env)

  // Supervisors who are also sellers keep the supervisor role
  const effectiveRole = supervisorEmails.has(row.email.toLowerCase()) ? 'supervisor' : role

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: row.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: row.full_name,
      role: effectiveRole,
    },
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      const { data: list } = await supabase.auth.admin.listUsers()
      const existing = (list?.users || []).find((u: { id: string; email?: string | null }) => u.email?.toLowerCase() === row.email.toLowerCase())
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

  console.log('\nDone.')
}

main().catch(console.error)

