import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

async function testLogin() {
  const email = requireEnv('TEST_LOGIN_EMAIL')
  const password = requireEnv('TEST_LOGIN_PASSWORD')

  console.log(`Testing login with ${email}...`)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Login failed:', error.message)
    return
  }

  console.log('Login successful!')
  console.log('User ID:', data.user?.id)
  console.log('Email:', data.user?.email)
}

testLogin()
