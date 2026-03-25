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

async function main() {
  const email = 'contact@symi.io'
  const fullName = 'SYMI Observer'

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

    // Check if contact@symi.io profile exists
    const symiProfile = allProfiles?.find(p => p.email === email)
    if (symiProfile) {
      console.log('\nSYMI profile exists:', symiProfile)
      return
    }

    // If not, we need to create the auth user first via the dashboard
    // or use the admin API correctly
    console.log('\nProfile does not exist. Let me try admin.getUserById...')

    // Try to get the user ID by attempting login (won't work without correct password)
    // Instead, let's just create a fresh user
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: 'Success26',
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'supervisor' }
    })

    if (createErr) {
      if (createErr.code === 'email_exists') {
        console.log('\nUser exists in auth but not in profiles.')
        console.log('This means the trigger failed. Manual fix needed.')
        console.log('\nOption 1: Sign in at /login with contact@symi.io / Success26')
        console.log('          The system will create the profile on first login.')
        console.log('\nOption 2: Run this SQL in Supabase dashboard:')
        console.log(`
INSERT INTO profiles (id, email, full_name, role, active)
SELECT id, email, '${fullName}', 'supervisor', true
FROM auth.users WHERE email = '${email}'
ON CONFLICT (id) DO UPDATE SET role = 'supervisor', full_name = '${fullName}';
        `)
      } else {
        console.error('Create error:', createErr)
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
      console.error('Profile insert error:', insertErr)
    } else {
      console.log('Profile created successfully')
    }

    return
  }

  console.log('Auth users:', authUsers)
}

main().catch(console.error)
