/**
 * Create admin user using direct SQL
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function main() {
  const email = requireEnv('ADMIN_EMAIL')
  const password = requireEnv('ADMIN_PASSWORD')
  const fullName = process.env.ADMIN_FULL_NAME || 'SYMI Observer'

  // Query auth.users directly via SQL
  const { data: authUsers, error: sqlError } = await supabase.rpc('exec_sql', {
    query: `SELECT id, email FROM auth.users WHERE email = '${email}'`
  })

  if (sqlError) {
    console.log('RPC not available, trying alternative...')

    // Alternative: Check all profiles first
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email, role')
      .order('email')

    console.log('All profiles:')
    allProfiles?.forEach(p => console.log(`  ${p.email} - ${p.role}`))

    // Check if profile exists
    const profileMatch = allProfiles?.find(p => p.email === email)
    if (profileMatch) {
      console.log('\nProfile exists:', profileMatch)
      return
    }

    console.log('\nProfile does not exist. Creating user via admin API...')

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'supervisor' }
    })

    if (createErr) {
      if (createErr.code === 'email_exists') {
        console.log('\nUser exists in auth but not in profiles.')
        console.log('Manual profile backfill may be required.')
        console.log('\nSuggested SQL:')
        console.log(`
INSERT INTO profiles (id, email, full_name, role, active)
SELECT id, email, '${fullName}', 'supervisor', true
FROM auth.users WHERE email = '${email}'
ON CONFLICT (id) DO UPDATE SET role = 'supervisor', full_name = '${fullName}';
        `)
      } else {
        console.error('Create error:', createErr.message)
      }
      return
    }

    console.log('Created user:', created?.user?.id)

    // Create profile
    const { error: insertErr } = await supabase
      .from('profiles')
      .insert({
        id: created!.user.id,
        email,
        full_name: fullName,
        role: 'supervisor',
        active: true
      })

    if (insertErr) {
      console.error('Profile insert error:', insertErr.message)
    } else {
      console.log('Profile created successfully')
    }

    return
  }

  console.log('Auth users:', authUsers)
}

main().catch(console.error)
