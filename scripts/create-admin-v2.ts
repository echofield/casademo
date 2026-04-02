/**
 * Create admin user v2 - handle existing user case
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

  console.log('Creating/fixing admin user:', email)

  // Try to create - if fails with email_exists, that's fine
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'supervisor'
    }
  })

  let userId: string

  if (createError?.code === 'email_exists') {
    console.log('User already exists, fetching by email...')

    const { data: authUsers } = await supabase.rpc('get_user_by_email', { p_email: email })

    if (!authUsers) {
      // Fallback: try to get from profiles if it exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile) {
        userId = profile.id
        console.log('Found user via profile:', userId)
      } else {
        console.error('Could not find user. Manual profile fix required.')
        return
      }
    } else {
      userId = authUsers
    }
  } else if (createError) {
    console.error('Create error:', createError.message)
    return
  } else {
    userId = newUser!.user.id
    console.log('Created new user:', userId)
  }

  // Wait for trigger
  await new Promise(r => setTimeout(r, 500))

  // Upsert profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      full_name: fullName,
      role: 'supervisor',
      active: true
    }, { onConflict: 'id' })
    .select()
    .single()

  if (profileError) {
    console.error('Profile error:', profileError.message)
  } else {
    console.log('Profile ready:', profile)
  }

  console.log('\n=== Account Ready ===')
  console.log('Email:', email)
  console.log('Role: supervisor (invisible)')
}

main().catch(console.error)
