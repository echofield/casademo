import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function check() {
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Error:', error.message)
    return
  }
  console.log('Users in Supabase Auth:')
  data.users.forEach(u => {
    console.log('- ' + u.email + ' | confirmed: ' + (u.email_confirmed_at ? 'yes' : 'no'))
  })
}
check()
