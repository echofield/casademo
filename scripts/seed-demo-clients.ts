import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Demo clients with realistic luxury fashion data
const DEMO_CLIENTS = [
  // Grand Prix tier
  { first_name: 'Isabelle', last_name: 'Fontaine', email: 'i.fontaine@demo.com', phone: '+33 6 12 34 56 78', tier: 'grand_prix', total_spend: 45000 },
  { first_name: 'Alexandre', last_name: 'Beaumont', email: 'a.beaumont@demo.com', phone: '+33 6 23 45 67 89', tier: 'grand_prix', total_spend: 38000 },
  { first_name: 'Victoria', last_name: 'Laurent', email: 'v.laurent@demo.com', phone: '+33 6 34 56 78 90', tier: 'grand_prix', total_spend: 52000 },

  // Diplomatico tier
  { first_name: 'Nicolas', last_name: 'Mercier', email: 'n.mercier@demo.com', phone: '+33 6 45 67 89 01', tier: 'diplomatico', total_spend: 22000 },
  { first_name: 'Charlotte', last_name: 'Dubois', email: 'c.dubois@demo.com', phone: '+33 6 56 78 90 12', tier: 'diplomatico', total_spend: 19500 },
  { first_name: 'Philippe', last_name: 'Martin', email: 'p.martin@demo.com', phone: '+33 6 67 89 01 23', tier: 'diplomatico', total_spend: 21000 },

  // Idealiste tier
  { first_name: 'Sophie', last_name: 'Bernard', email: 's.bernard@demo.com', phone: '+33 6 78 90 12 34', tier: 'idealiste', total_spend: 14500 },
  { first_name: 'Jean-Pierre', last_name: 'Rousseau', email: 'jp.rousseau@demo.com', phone: '+33 6 89 01 23 45', tier: 'idealiste', total_spend: 12800 },
  { first_name: 'Marie', last_name: 'Lefebvre', email: 'm.lefebvre@demo.com', phone: '+33 6 90 12 34 56', tier: 'idealiste', total_spend: 11200 },
  { first_name: 'François', last_name: 'Moreau', email: 'f.moreau@demo.com', phone: '+33 6 01 23 45 67', tier: 'idealiste', total_spend: 15000 },

  // Kaizen tier
  { first_name: 'Camille', last_name: 'Simon', email: 'c.simon@demo.com', phone: '+33 6 11 22 33 44', tier: 'kaizen', total_spend: 4500 },
  { first_name: 'Thomas', last_name: 'Michel', email: 't.michel@demo.com', phone: '+33 6 22 33 44 55', tier: 'kaizen', total_spend: 3800 },
  { first_name: 'Émilie', last_name: 'Garcia', email: 'e.garcia@demo.com', phone: '+33 6 33 44 55 66', tier: 'kaizen', total_spend: 5200 },
  { first_name: 'Antoine', last_name: 'David', email: 'a.david@demo.com', phone: '+33 6 44 55 66 77', tier: 'kaizen', total_spend: 2900 },
  { first_name: 'Julie', last_name: 'Bertrand', email: 'j.bertrand@demo.com', phone: '+33 6 55 66 77 88', tier: 'kaizen', total_spend: 6100 },

  // Optimisto tier
  { first_name: 'Lucas', last_name: 'Roux', email: 'l.roux@demo.com', phone: '+33 6 66 77 88 99', tier: 'optimisto', total_spend: 1800 },
  { first_name: 'Léa', last_name: 'Vincent', email: 'l.vincent@demo.com', phone: '+33 6 77 88 99 00', tier: 'optimisto', total_spend: 2200 },
  { first_name: 'Hugo', last_name: 'Fournier', email: 'h.fournier@demo.com', phone: '+33 6 88 99 00 11', tier: 'optimisto', total_spend: 1500 },

  // Rainbow tier
  { first_name: 'Clara', last_name: 'Girard', email: 'c.girard@demo.com', phone: '+33 6 99 00 11 22', tier: 'rainbow', total_spend: 450 },
  { first_name: 'Maxime', last_name: 'Andre', email: 'm.andre@demo.com', phone: '+33 6 00 11 22 33', tier: 'rainbow', total_spend: 780 },
  { first_name: 'Emma', last_name: 'Leroy', email: 'e.leroy@demo.com', phone: '+33 7 12 34 56 78', tier: 'rainbow', total_spend: 320 },
  { first_name: 'Louis', last_name: 'Robert', email: 'l.robert@demo.com', phone: '+33 7 23 45 67 89', tier: 'rainbow', total_spend: 550 },
]

async function main() {
  console.log('Seeding demo clients...')

  // Get sellers to distribute clients among them
  const { data: sellers, error: sellersError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('active', true)

  if (sellersError || !sellers?.length) {
    console.error('No sellers found:', sellersError)
    return
  }

  console.log(`Found ${sellers.length} sellers`)

  // Delete existing demo clients first
  const { error: deleteError } = await supabase
    .from('clients')
    .delete()
    .eq('is_demo', true)

  if (deleteError) {
    console.error('Error deleting old demo clients:', deleteError)
  } else {
    console.log('Cleared existing demo clients')
  }

  // Insert demo clients, distributing among sellers
  let created = 0
  for (let i = 0; i < DEMO_CLIENTS.length; i++) {
    const client = DEMO_CLIENTS[i]
    const seller = sellers[i % sellers.length]

    const daysAgo = Math.floor(Math.random() * 60) + 1
    const lastContact = new Date()
    lastContact.setDate(lastContact.getDate() - daysAgo)

    const nextContact = new Date(lastContact)
    nextContact.setDate(nextContact.getDate() + (client.tier === 'grand_prix' ? 7 : client.tier === 'diplomatico' ? 14 : 30))

    const { error } = await supabase.from('clients').insert({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone,
      tier: client.tier,
      total_spend: client.total_spend,
      seller_id: seller.id,
      is_demo: true,
      last_contact_date: lastContact.toISOString().split('T')[0],
      next_recontact_date: nextContact.toISOString().split('T')[0],
      notes: '[demo]',
    })

    if (error) {
      console.error(`Error creating ${client.first_name} ${client.last_name}:`, error.message)
    } else {
      created++
    }
  }

  console.log(`\nCreated ${created} demo clients`)
  console.log('Done!')
}

main().catch(console.error)
