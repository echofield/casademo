/**
 * Debug admin user and profile
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function debug() {
  const email = 'contact@symi.io'

  // List all users (paginated - get more)
  let page = 1
  let authUser = null

  while (!authUser && page <= 5) {
    const { data } = await supabase.auth.admin.listUsers({ page, perPage: 100 })
    authUser = data?.users?.find(u => u.email === email)
    if (!authUser) {
      console.log(`Page ${page}: ${data?.users?.length} users, admin not found`)
    }
    page++
  }

  if (authUser) {
    console.log('\n=== Auth User Found ===')
    console.log('ID:', authUser.id)
    console.log('Email:', authUser.email)
    console.log('Created:', authUser.created_at)

    // Check profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profile) {
      console.log('\n=== Profile ===')
      console.log(profile)
    } else {
      console.log('\n=== No Profile - Creating... ===')

      const { data: newProfile, error: insertError } = await supabase
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

      if (insertError) {
        console.error('Insert error:', insertError)
      } else {
        console.log('Created profile:', newProfile)
      }
    }
  } else {
    console.log('Auth user not found in any page')
  }
}

debug().catch(console.error)
