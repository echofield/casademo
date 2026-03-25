import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

// GET /api/seller/impact - Get seller's CRM impact for current month
export async function GET() {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    // Calculate current month start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const dateFilter = monthStart.toISOString().split('T')[0]

    // Get seller's purchases this month
    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, amount, source')
      .eq('seller_id', user.id)
      .gte('purchase_date', dateFilter)

    const allPurchases = purchases || []

    let totalSales = allPurchases.length
    let crmSales = 0
    let crmRevenue = 0

    allPurchases.forEach(p => {
      if (p.source === 'casa_one') {
        crmSales++
        crmRevenue += p.amount || 0
      }
    })

    return NextResponse.json({
      crm_sales: crmSales,
      crm_revenue: crmRevenue,
      total_sales: totalSales,
      crm_pct: totalSales > 0 ? Math.round((crmSales / totalSales) * 100) : 0,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Seller impact API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
