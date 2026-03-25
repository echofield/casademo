/**
 * Create profile using admin client with RLS bypass
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

async function main() {
  const email = 'contact@symi.io'
  const userId = '4ec16a8e-014c-4275-9920-5724118c643e' // From sign-in

  // Create admin client with service role (bypasses RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    }
  )

  console.log('Creating profile for user:', userId)

  // Check if profile exists
  const { data: existing } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existing) {
    console.log('Profile already exists:', existing)

    // Update to supervisor
    const { data: updated, error: updateErr } = await adminClient
      .from('profiles')
      .update({ role: 'supervisor', full_name: 'SYMI Observer', active: true })
      .eq('id', userId)
      .select()
      .single()

    if (updateErr) {
      console.error('Update error:', updateErr)
    } else {
      console.log('Updated profile:', updated)
    }
    return
  }

  // Insert new profile
  const { data: profile, error: insertErr } = await adminClient
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      full_name: 'SYMI Observer',
      role: 'supervisor',
      active: true
    })
    .select()
    .single()

  if (insertErr) {
    console.error('Insert error:', insertErr)
    console.log('\nTrying raw SQL via PostgREST...')

    // Try using REST API directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const res = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: userId,
        email: email,
        full_name: 'SYMI Observer',
        role: 'supervisor',
        active: true
      })
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('REST API error:', err)
    } else {
      const data = await res.json()
      console.log('Created via REST:', data)
    }
  } else {
    console.log('Created profile:', profile)
  }

  // Verify
  const { data: verify } = await adminClient
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  console.log('\nFinal profile:', verify)
}

main().catch(console.error)
