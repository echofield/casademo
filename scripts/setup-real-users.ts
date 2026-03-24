/**
 * Create or update real auth users with correct passwords.
 * Links them to existing profiles by matching email.
 *
 * Run: npx tsx scripts/setup-real-users.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

interface User {
  email: string
  password: string
  full_name: string
  role: 'seller' | 'supervisor'
}

const USERS: User[] = [
  { email: 'julane.moussa@casablancaparis.com',        password: 'Lifecasaway26',         full_name: 'Hasael Moussa',        role: 'supervisor' },
  { email: 'hicham.elhimar@casablancaparis.com',       password: 'Casaovervision26',      full_name: 'Hicham EL Himar',      role: 'supervisor' },
  { email: 'elliott.nowack@casablancaparis.com',       password: 'elliott1993casablanca', full_name: 'Elliott Nowack',        role: 'seller' },
  { email: 'helen.kidane@casablancaparis.com',         password: 'Cropit2003',            full_name: 'Helen Kidane',          role: 'seller' },
  { email: 'maxime.hudzevych@casablancaparis.com',     password: 'Dyakuyumax26',          full_name: 'Maxime Hudzevych',      role: 'seller' },
  { email: 'raphael.rivera@casablancaparis.com',       password: 'Badbunnybaby93',        full_name: 'Raphael Rivera',        role: 'seller' },
  { email: 'yassmine.moutaouakil@casablancaparis.com', password: 'Casayass26',            full_name: 'Yassmine Moutaouakil',  role: 'seller' },
]

async function main() {
  console.log('='.repeat(60))
  console.log('SETTING UP REAL AUTH USERS')
  console.log('='.repeat(60))

  // List all existing auth users
  const allUsers: Array<{ id: string; email?: string }> = []
  let page = 1
  while (true) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (!data?.users?.length) break
    allUsers.push(...data.users)
    if (data.users.length < 1000) break
    page++
  }
  console.log(`\nTotal auth users in Supabase: ${allUsers.length}`)

  const byEmail = new Map(allUsers.map(u => [u.email?.toLowerCase() || '', u]))

  for (const u of USERS) {
    const existing = byEmail.get(u.email.toLowerCase())

    if (existing) {
      // User exists — update password
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      })
      if (error) {
        console.log(`FAILED update ${u.email}: ${error.message}`)
      } else {
        // Sync profile
        await supabase.from('profiles').upsert({
          id: existing.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role,
          active: true,
        })
        console.log(`UPDATED: ${u.full_name} <${u.email}>`)
      }
    } else {
      // User doesn't exist — create
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role },
      })

      if (createErr) {
        console.log(`FAILED create ${u.email}: ${createErr.message}`)
        continue
      }

      const newId = created.user.id

      // Check if profile exists with this email
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', u.email)
        .single()

      if (existingProfile && existingProfile.id !== newId) {
        // Relink clients from old profile to new auth user
        const { count } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', existingProfile.id)

        if (count && count > 0) {
          await supabase.from('clients').update({ seller_id: newId }).eq('seller_id', existingProfile.id)
          console.log(`  Relinked ${count} clients`)
        }
        await supabase.from('profiles').delete().eq('id', existingProfile.id)
      }

      await supabase.from('profiles').upsert({
        id: newId,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        active: true,
      })

      console.log(`CREATED: ${u.full_name} <${u.email}>`)
    }
  }

  // Verify
  console.log('\n' + '='.repeat(60))
  console.log('VERIFICATION')
  console.log('='.repeat(60))

  for (const u of USERS) {
    // Test sign-in
    const { error } = await supabase.auth.signInWithPassword({
      email: u.email,
      password: u.password,
    })
    const status = error ? `FAIL: ${error.message}` : 'OK'
    const { count } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', (await supabase.from('profiles').select('id').eq('email', u.email).single()).data?.id || '')
    console.log(`  ${status.padEnd(8)} ${u.full_name.padEnd(25)} <${u.email}> ${count || 0} clients`)

    // Sign out after test
    await supabase.auth.signOut()
  }
}

main().catch(console.error)
