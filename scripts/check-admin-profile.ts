/**
 * Check admin profile visibility
 */
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function checkProfile() {
  // Get admin profile
  const { data: admin } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'contact@symi.io')
    .single()

  console.log('=== Admin Profile ===')
  console.log(admin)

  // Check if admin appears in seller lists
  const { data: sellers } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'seller')
    .eq('active', true)

  console.log('\n=== Sellers visible in system ===')
  sellers?.forEach(s => console.log(`- ${s.full_name} (${s.role})`))

  const adminInSellers = sellers?.find(s => s.id === admin?.id)
  console.log('\n=== Admin visible as seller? ===')
  console.log(adminInSellers ? 'YES (problem!)' : 'NO (correct - invisible)')
}

checkProfile().catch(console.error)
