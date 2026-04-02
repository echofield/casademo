/**
 * Migrate mock @casaone.fr auth accounts to real @casablancaparis.com emails + passwords.
 * Also creates auth users for sellers who only have profiles (from CSV import).
 * Updates in place so all client/profile relationships stay intact.
 *
 * Run: npx tsx scripts/migrate-to-real-accounts.ts
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

interface TeamMember {
  mock_email: string | null   // existing @casaone.fr email, null if no auth user exists
  real_email: string
  password_env: string
  full_name: string
  role: 'seller' | 'supervisor'
}

const TEAM: TeamMember[] = [
  // Supervisors
  { mock_email: 'hasael.moussa@casaone.fr',   real_email: 'julane.moussa@casablancaparis.com',        password_env: 'CASABLANCA_PASSWORD_HASAEL',         full_name: 'Hasael Moussa',        role: 'supervisor' },
  { mock_email: 'hicham.elhimar@casaone.fr',  real_email: 'hicham.elhimar@casablancaparis.com',       password_env: 'CASABLANCA_PASSWORD_HICHAM',      full_name: 'Hicham EL Himar',      role: 'supervisor' },
  // Sellers with existing mock accounts
  { mock_email: 'elliott.nowack@casaone.fr',  real_email: 'elliott.nowack@casablancaparis.com',       password_env: 'CASABLANCA_PASSWORD_ELLIOTT', full_name: 'Elliott Nowack',        role: 'seller' },
  { mock_email: 'helen.kidane@casaone.fr',    real_email: 'helen.kidane@casablancaparis.com',         password_env: 'CASABLANCA_PASSWORD_HELEN',            full_name: 'Helen Kidane',          role: 'seller' },
  // Sellers without auth accounts (only profiles from CSV import)
  { mock_email: null,                         real_email: 'maxime.hudzevych@casablancaparis.com',     password_env: 'CASABLANCA_PASSWORD_MAXIME',          full_name: 'Maxime Hudzevych',      role: 'seller' },
  { mock_email: null,                         real_email: 'raphael.rivera@casablancaparis.com',       password_env: 'CASABLANCA_PASSWORD_RAPHAEL',        full_name: 'Raphael Rivera',        role: 'seller' },
  { mock_email: null,                         real_email: 'yassmine.moutaouakil@casablancaparis.com', password_env: 'CASABLANCA_PASSWORD_YASSMINE',            full_name: 'Yassmine Moutaouakil',  role: 'seller' },
]

const DEACTIVATE_NAMES = ['Hamza Said', 'Ryan Jackson']

// Orphan duplicates from previous seed runs (not linked to client data)
function requireSecret(envName: string): string {
  const value = process.env[envName]
  if (!value) {
    console.error(`Missing required env var: ${envName}`)
    process.exit(1)
  }
  return value
}

const ORPHAN_EMAILS = [
  'julane.moussa@casablancaparis.com',
  'julane.moussa@casaone.com',
  'julane.moussa@casaone.fr',
  'hicham.elhimar@casablancaparis.com',
  'elliott.nowack@casablancaparis.com',
  'helen.kidane@casablancaparis.com',
  'maxime.hudzevych@casablancaparis.com',
  'raphael.rivera@casablancaparis.com',
  'yassmine.moutaouakil@casablancaparis.com',
]

async function getAllUsers() {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  return data?.users || []
}

async function getClientCount(profileId: string): Promise<number> {
  const { count } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', profileId)
  return count || 0
}

async function main() {
  console.log('='.repeat(60))
  console.log('MIGRATING TO REAL ACCOUNTS')
  console.log('='.repeat(60))
  console.log()

  const allUsers = await getAllUsers()
  const byEmail = new Map(allUsers.map(u => [u.email?.toLowerCase() || '', u]))

  // â”€â”€ Step 1: Clean up orphan duplicates â”€â”€
  console.log('--- Step 1: Cleaning orphan duplicate accounts ---')
  for (const email of ORPHAN_EMAILS) {
    const user = byEmail.get(email.toLowerCase())
    if (!user) { console.log(`  skip (not found): ${email}`); continue }

    const clients = await getClientCount(user.id)
    if (clients > 0) {
      console.log(`  KEPT (has ${clients} clients): ${email}`)
      continue
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) { console.log(`  FAILED delete ${email}: ${error.message}`); continue }
    await supabase.from('profiles').delete().eq('id', user.id)
    byEmail.delete(email.toLowerCase())
    console.log(`  DELETED orphan: ${email}`)
  }

  // â”€â”€ Step 2: Migrate existing mock accounts â”€â”€
  console.log('\n--- Step 2: Updating mock accounts â†’ real credentials ---')
  for (const m of TEAM.filter(t => t.mock_email)) {
    const mockUser = byEmail.get(m.mock_email!.toLowerCase())
    if (!mockUser) {
      console.log(`  NOT FOUND: ${m.mock_email} â€” will create fresh`)
      m.mock_email = null // fall through to step 3
      continue
    }

    const { error: authErr } = await supabase.auth.admin.updateUserById(mockUser.id, {
      email: m.real_email,
      password: requireSecret(m.password_env),
      email_confirm: true,
      user_metadata: { full_name: m.full_name, role: m.role },
    })

    if (authErr) { console.log(`  FAILED: ${m.mock_email}: ${authErr.message}`); continue }

    await supabase.from('profiles')
      .update({ email: m.real_email, full_name: m.full_name, role: m.role, active: true })
      .eq('id', mockUser.id)

    const clients = await getClientCount(mockUser.id)
    console.log(`  MIGRATED: ${m.mock_email} â†’ ${m.real_email} [${m.role}] (${clients} clients)`)
  }

  // â”€â”€ Step 3: Create auth users for sellers who only have profiles â”€â”€
  console.log('\n--- Step 3: Creating auth for profile-only sellers ---')
  for (const m of TEAM.filter(t => !t.mock_email)) {
    // Find existing profile by full_name (case-insensitive)
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', m.full_name)

    const oldProfile = existingProfiles?.[0]

    // Check if auth user already exists with the real email (maybe re-running script)
    const existingAuth = byEmail.get(m.real_email.toLowerCase())
    if (existingAuth) {
      console.log(`  EXISTS: ${m.real_email} â€” updating password + profile`)
      await supabase.auth.admin.updateUserById(existingAuth.id, {
        password: requireSecret(m.password_env),
        email_confirm: true,
        user_metadata: { full_name: m.full_name, role: m.role },
      })
      await supabase.from('profiles').upsert({
        id: existingAuth.id,
        email: m.real_email,
        full_name: m.full_name,
        role: m.role,
        active: true,
      })
      // If old profile existed with different ID, relink clients
      if (oldProfile && oldProfile.id !== existingAuth.id) {
        const { count } = await supabase
          .from('clients').select('id', { count: 'exact', head: true })
          .eq('seller_id', oldProfile.id)
        if (count && count > 0) {
          await supabase.from('clients').update({ seller_id: existingAuth.id }).eq('seller_id', oldProfile.id)
          await supabase.from('profiles').delete().eq('id', oldProfile.id)
          console.log(`    Relinked ${count} clients from old profile â†’ new`)
        }
      }
      continue
    }

    // Create new auth user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: m.real_email,
      password: requireSecret(m.password_env),
      email_confirm: true,
      user_metadata: { full_name: m.full_name, role: m.role },
    })

    if (createErr) { console.log(`  FAILED: ${m.real_email}: ${createErr.message}`); continue }

    const newId = created.user.id

    if (oldProfile) {
      // Relink all clients from old profile to new auth user
      const clientCount = await getClientCount(oldProfile.id)
      if (clientCount > 0) {
        await supabase.from('clients').update({ seller_id: newId }).eq('seller_id', oldProfile.id)
        console.log(`    Relinked ${clientCount} clients`)
      }
      // Delete old profile, create new one with auth ID
      await supabase.from('profiles').delete().eq('id', oldProfile.id)
    }

    await supabase.from('profiles').upsert({
      id: newId,
      email: m.real_email,
      full_name: m.full_name,
      role: m.role,
      active: true,
    })

    console.log(`  CREATED: ${m.full_name} <${m.real_email}> [${m.role}]`)
  }

  // â”€â”€ Step 4: Deactivate removed team members â”€â”€
  console.log('\n--- Step 4: Deactivating removed members ---')
  for (const name of DEACTIVATE_NAMES) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', name)

    if (!profiles?.length) { console.log(`  skip (not found): ${name}`); continue }

    for (const p of profiles) {
      // Reassign their clients to Hasael Moussa
      const { data: hasael } = await supabase
        .from('profiles')
        .select('id')
        .ilike('full_name', 'Hasael Moussa')
        .eq('active', true)
        .limit(1)
        .single()

      if (hasael) {
        const clientCount = await getClientCount(p.id)
        if (clientCount > 0) {
          await supabase.from('clients').update({ seller_id: hasael.id }).eq('seller_id', p.id)
          console.log(`    Reassigned ${clientCount} clients â†’ Hasael Moussa`)
        }
      }

      await supabase.from('profiles').update({ active: false }).eq('id', p.id)
      console.log(`  DEACTIVATED: ${p.full_name} <${p.email}>`)
    }
  }

  // â”€â”€ Step 5: Deactivate pure demo accounts â”€â”€
  console.log('\n--- Step 5: Deactivating remaining demo accounts ---')
  const { data: demoProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('active', true)
    .like('email', '%@casaone.fr')

  if (demoProfiles?.length) {
    for (const dp of demoProfiles) {
      await supabase.from('profiles').update({ active: false }).eq('id', dp.id)
      console.log(`  DEACTIVATED: ${dp.full_name} <${dp.email}>`)
    }
  } else {
    console.log('  None found')
  }

  // â”€â”€ Summary â”€â”€
  console.log('\n' + '='.repeat(60))
  console.log('FINAL ACTIVE TEAM')
  console.log('='.repeat(60))
  const { data: finalProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('active', true)
    .order('role')
    .order('full_name')

  if (finalProfiles) {
    for (const p of finalProfiles) {
      const clients = await getClientCount(p.id)
      console.log(`  [${p.role.padEnd(10)}] ${p.full_name.padEnd(22)} <${p.email}> â€” ${clients} clients`)
    }
  }

  console.log('\nDone.')
}

main().catch(console.error)


