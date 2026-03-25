/**
 * Create admin user for SYMI observation account
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

async function createAdminUser() {
  const email = 'contact@symi.io'
  const password = 'Success26'
  const fullName = 'SYMI Admin'

  console.log('Creating admin user:', email)

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existing = existingUsers?.users?.find(u => u.email === email)

  if (existing) {
    console.log('User already exists with ID:', existing.id)

    // Update their profile to supervisor role
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'supervisor', full_name: fullName })
      .eq('id', existing.id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
    } else {
      console.log('Updated profile to supervisor role')
    }
    return
  }

  // Create new user with email/password
  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      full_name: fullName,
      role: 'supervisor'
    }
  })

  if (createError) {
    console.error('Failed to create user:', createError)
    return
  }

  console.log('Created user:', newUser.user.id)

  // The trigger should create the profile, but let's ensure supervisor role
  // Wait a moment for trigger to fire
  await new Promise(r => setTimeout(r, 1000))

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'supervisor', full_name: fullName })
    .eq('id', newUser.user.id)

  if (updateError) {
    console.error('Failed to update profile:', updateError)
  } else {
    console.log('Profile set to supervisor role')
  }

  console.log('\n=== Admin Account Created ===')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('Role: supervisor')
  console.log('\nYou can also sign in with Google using this email.')
}

createAdminUser().catch(console.error)
