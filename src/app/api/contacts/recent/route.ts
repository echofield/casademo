import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

// GET /api/contacts/recent?seller_id={id}&since={isoDate}
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const sellerIdParam = searchParams.get('seller_id')
    const sinceParam = searchParams.get('since')
    const since = sinceParam || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Sellers can only request their own contacts. Supervisors can request all/specific seller.
    const sellerId = user.effectiveRole === 'seller'
      ? user.id
      : sellerIdParam || null

    if (user.effectiveRole === 'seller' && sellerIdParam && sellerIdParam !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let query = supabase
      .from('contacts')
      .select('id, contact_date, channel, comment, client:clients(id, first_name, last_name, tier), seller:profiles(full_name), seller_id')
      .gte('contact_date', since)
      .order('contact_date', { ascending: false })
      .limit(200)

    if (sellerId) query = query.eq('seller_id', sellerId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data || []).map((item: any) => {
      const client = Array.isArray(item.client) ? item.client[0] : item.client
      const seller = Array.isArray(item.seller) ? item.seller[0] : item.seller
      return {
        contact_id: item.id,
        contact_date: item.contact_date,
        channel: item.channel,
        comment: item.comment,
        client_id: client?.id || null,
        client_name: [client?.first_name, client?.last_name].filter(Boolean).join(' ').trim(),
        client_tier: client?.tier || null,
        seller_name: seller?.full_name || null,
      }
    })

    return NextResponse.json({ data: rows })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
