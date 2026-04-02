import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const demoPassword = process.env.DEMO_USER_PASSWORD || 'demo-change-me'

const DEMO_USERS = [
  {
    email: process.env.DEMO_SUPERVISOR_EMAIL || 'julane.moussa@casaone.com',
    password: demoPassword,
    full_name: 'Julane Moussa',
    role: 'supervisor',
  },
  {
    email: process.env.DEMO_SELLER_EMAIL || 'hasael.moussa@casaone.fr',
    password: demoPassword,
    full_name: 'Hasael Moussa',
    role: 'seller',
  },
]

async function main() {
  console.log('Creating demo users...\n')

  for (const user of DEMO_USERS) {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already been registered')) {
        console.log(`${user.email} already exists, updating password...`)

        // Get user by email and update password
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = (users?.users || []).find((u: { id: string; email?: string | null }) => u.email === user.email)

        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: user.password,
          })
          console.log('  Password updated')
        }
        continue
      }
      console.error(`Error creating ${user.email}:`, authError.message)
      continue
    }

    const userId = authData.user.id
    console.log(`Created auth user: ${user.email}`)

    // Create profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      active: true,
    })

    if (profileError) {
      console.error('  Profile error:', profileError.message)
    } else {
      console.log(`  Profile created: ${user.full_name} (${user.role})`)
    }

    // Add role to profiles_roles
    const { error: roleError } = await supabase.from('profiles_roles').upsert({
      user_id: userId,
      role: user.role,
    })

    if (roleError) {
      console.error('  Role error:', roleError.message)
    } else {
      console.log(`  Role assigned: ${user.role}`)
    }

    console.log('')
  }

  console.log('Done!')
  console.log('Set DEMO_USER_PASSWORD to control seeded demo passwords.')
}

main().catch(console.error)

