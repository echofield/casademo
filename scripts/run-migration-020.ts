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

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

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

  const email = requireEnv('ADMIN_EMAIL')
  const password = requireEnv('ADMIN_PASSWORD')
  const fullName = process.env.ADMIN_FULL_NAME || 'SYMI Observer'

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

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
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
        email,
        full_name: fullName,
        role: 'supervisor',
        active: true
      }, { onConflict: 'id' })
      .select()
      .single()

    if (profileError) {
      console.error('Profile error:', profileError.message)
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
