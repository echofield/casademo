/**
 * Validate Seller Contacts Script
 * Checks that all sellers have real contact information (email, phone).
 * Notifies supervisors of any missing data.
 *
 * Run: npm run validate:contacts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Placeholder email domain to flag
const PLACEHOLDER_DOMAIN = '@casaone.fr'

interface ValidationIssue {
  sellerId: string
  sellerName: string
  missingEmail: boolean
  missingPhone: boolean
}

async function validateSellerContacts() {
  console.log('='.repeat(60))
  console.log('VALIDATING SELLER CONTACTS')
  console.log('='.repeat(60))
  console.log()

  // 1. Get all sellers
  const { data: sellers, error: sellersError } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, personal_email, role')
    .eq('role', 'seller')
    .eq('active', true)

  if (sellersError) {
    console.error('Error fetching sellers:', sellersError.message)
    process.exit(1)
  }

  if (!sellers || sellers.length === 0) {
    console.log('No active sellers found.')
    return
  }

  console.log(`Found ${sellers.length} active sellers\n`)

  // 2. Validate each seller
  const issues: ValidationIssue[] = []
  const valid: string[] = []

  for (const seller of sellers) {
    const hasRealEmail = seller.email && !seller.email.endsWith(PLACEHOLDER_DOMAIN)
    const hasPhone = Boolean(seller.phone)

    if (!hasRealEmail || !hasPhone) {
      issues.push({
        sellerId: seller.id,
        sellerName: seller.full_name || seller.email,
        missingEmail: !hasRealEmail,
        missingPhone: !hasPhone,
      })
    } else {
      valid.push(seller.full_name || seller.email)
    }
  }

  // 3. Print report
  console.log('--- VALIDATION REPORT ---\n')

  if (valid.length > 0) {
    console.log(`VALID (${valid.length}):`)
    valid.forEach(name => console.log(`  [OK] ${name}`))
    console.log()
  }

  if (issues.length > 0) {
    console.log(`ISSUES (${issues.length}):`)
    issues.forEach(issue => {
      const missing: string[] = []
      if (issue.missingEmail) missing.push('email')
      if (issue.missingPhone) missing.push('phone')
      console.log(`  [!] ${issue.sellerName}: missing ${missing.join(', ')}`)
    })
    console.log()

    // 4. Get supervisors to notify
    const { data: supervisors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'supervisor')
      .eq('active', true)

    if (supervisors && supervisors.length > 0) {
      console.log('--- CREATING NOTIFICATIONS ---\n')

      for (const issue of issues) {
        const missingItems: string[] = []
        if (issue.missingEmail) missingItems.push('email')
        if (issue.missingPhone) missingItems.push('telephone')

        const message = `${issue.sellerName} n'a pas de ${missingItems.join(' ni ')} renseigne`

        // Create notification for each supervisor
        for (const supervisor of supervisors) {
          const { error: notifError } = await supabase
            .from('notifications')
            .insert({
              user_id: supervisor.id,
              type: 'system' as const,
              title: 'Donnees vendeur incompletes',
              message,
              reference_type: 'profile',
              reference_id: issue.sellerId,
            })

          if (notifError) {
            console.log(`  Failed to notify ${supervisor.full_name}: ${notifError.message}`)
          } else {
            console.log(`  Notified ${supervisor.full_name} about ${issue.sellerName}`)
          }
        }
      }
    } else {
      console.log('No supervisors found to notify.')
    }
  }

  // 5. Summary
  console.log()
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total sellers:  ${sellers.length}`)
  console.log(`Valid:          ${valid.length}`)
  console.log(`With issues:    ${issues.length}`)

  if (issues.length > 0) {
    console.log()
    console.log('ACTION REQUIRED: Update seller profiles with missing contact info.')
    console.log(`Supervisors have been notified of ${issues.length} incomplete profiles.`)
  } else {
    console.log()
    console.log('All seller contacts are complete!')
  }
}

validateSellerContacts().catch(console.error)
