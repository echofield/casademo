import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DEMO_USERS = [
  {
    email: 'julane.moussa@casaone.com',
    password: 'test1234',
    full_name: 'Julane Moussa',
    role: 'supervisor',
  },
  {
    email: 'hasael.moussa@casaone.fr',
    password: 'test1234',
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
        const existingUser = users?.users?.find(u => u.email === user.email)

        if (existingUser) {
          await supabase.auth.admin.updateUserById(existingUser.id, {
            password: user.password,
          })
          console.log(`  Password updated to: ${user.password}`)
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
      console.error(`  Profile error:`, profileError.message)
    } else {
      console.log(`  Profile created: ${user.full_name} (${user.role})`)
    }

    // Add role to profiles_roles
    const { error: roleError } = await supabase.from('profiles_roles').upsert({
      user_id: userId,
      role: user.role,
    })

    if (roleError) {
      console.error(`  Role error:`, roleError.message)
    } else {
      console.log(`  Role assigned: ${user.role}`)
    }

    console.log(`  Password: ${user.password}\n`)
  }

  console.log('Done!')
  console.log('\nLogin credentials:')
  DEMO_USERS.forEach(u => {
    console.log(`  ${u.email} / ${u.password} (${u.role})`)
  })
}

main().catch(console.error)
