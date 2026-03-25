/**
 * Run migration 020 directly
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Read migration SQL
  const sql = readFileSync('supabase/migrations/020_symi_admin_profile.sql', 'utf-8')

  // Extract just the INSERT statement
  const insertSql = sql
    .split('\n')
    .filter(line => !line.startsWith('--') && line.trim())
    .join('\n')

  console.log('Running SQL:')
  console.log(insertSql)
  console.log('')

  // Execute via Supabase
  // Since we can't run raw SQL directly, we need to use the REST API
  // Let's just do the insert manually

  // First get the user ID from auth
  const email = 'contact@symi.io'

  // Try inserting the profile - if user doesn't exist in auth, this will fail
  // We need the user ID from auth.users

  // Workaround: Use fetch to hit Supabase REST API directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: insertSql
    })
  })

  if (!response.ok) {
    console.log('RPC not available, trying alternative approach...')

    // Get all auth users and find the one we need
    // This is a workaround since we can't query auth.users directly via REST

    // Alternative: Sign in to get the user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'contact@symi.io',
      password: 'Success26'
    })

    if (signInError) {
      console.error('Sign in failed:', signInError.message)
      return
    }

    const userId = signInData.user?.id
    console.log('Got user ID via sign-in:', userId)

    // Now create the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: 'contact@symi.io',
        full_name: 'SYMI Observer',
        role: 'supervisor',
        active: true
      }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
    } else {
      console.log('Profile created:', profile)
    }

    // Sign out
    await supabase.auth.signOut()
  } else {
    console.log('Migration executed successfully')
  }
}

main().catch(console.error)
