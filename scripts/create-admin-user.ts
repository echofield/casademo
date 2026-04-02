/**
 * Create admin user for observation account
 *
 * Run with: npx tsx scripts/create-admin-user.ts
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

async function createAdminUser() {
  const email = requireEnv('ADMIN_EMAIL')
  const password = requireEnv('ADMIN_PASSWORD')
  const fullName = process.env.ADMIN_FULL_NAME || 'SYMI Admin'

  console.log('Creating admin user:', email)

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = (existingUsers?.users || []).find((u: { id: string; email?: string | null }) => u.email === email)

  if (existing) {
    console.log('User already exists with ID:', existing.id)

    // Update their profile to supervisor role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'supervisor', full_name: fullName })
      .eq('id', existing.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError.message)
    } else {
      console.log('Updated profile to supervisor role')
    }
    return
  }

  // Create new user with email/password
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'supervisor'
    }
  })

  if (createError) {
    console.error('Failed to create user:', createError.message)
    return
  }

  console.log('Created user:', newUser.user.id)

  // The trigger should create the profile, but let's ensure supervisor role
  await new Promise(r => setTimeout(r, 1000))

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'supervisor', full_name: fullName })
    .eq('id', newUser.user.id)

  if (updateError) {
    console.error('Failed to update profile:', updateError.message)
  } else {
    console.log('Profile set to supervisor role')
  }

  console.log('\n=== Admin Account Ready ===')
  console.log('Email:', email)
  console.log('Role: supervisor')
}

createAdminUser().catch(console.error)

