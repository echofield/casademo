/**
 * Fix admin profile - ensure it exists with supervisor role
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function fixProfile() {
  const email = 'contact@symi.io'

  // Find the auth user
  const { data: users } = await supabase.auth.admin.listUsers()
  const authUser = users?.users?.find(u => u.email === email)

  if (!authUser) {
    console.error('Auth user not found for', email)
    return
  }

  console.log('Found auth user:', authUser.id)

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (existingProfile) {
    console.log('Profile already exists:', existingProfile)
    return
  }

  // Create profile
  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert({
      id: authUser.id,
      email: email,
      full_name: 'SYMI Observer',
      role: 'supervisor',
      active: true
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create profile:', error)
    return
  }

  console.log('Created profile:', newProfile)
  console.log('\n=== Account Ready ===')
  console.log('Email:', email)
  console.log('Role: supervisor (invisible to sellers)')
}

fixProfile().catch(console.error)
