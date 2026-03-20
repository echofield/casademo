import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testLogin() {
  console.log('Testing login with marie@casaone.fr / supervisor123...')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'marie@casaone.fr',
    password: 'supervisor123',
  })

  if (error) {
    console.error('Login failed:', error.message)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return
  }

  console.log('Login successful!')
  console.log('User ID:', data.user?.id)
  console.log('Email:', data.user?.email)
}

testLogin()
