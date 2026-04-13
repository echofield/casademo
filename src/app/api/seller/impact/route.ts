import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoSellerImpact } from '@/lib/demo/presentation-data'

export async function GET() {
  try {
    const user = await requireAuth()

    if (isDemoMode) {
      return NextResponse.json(getDemoSellerImpact(user.id))
    }

    const supabase = await createClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const dateFilter = monthStart.toISOString().split('T')[0]

    const { data: purchases } = await supabase
      .from('purchases')
      .select('id, amount, source')
      .eq('seller_id', user.id)
      .gte('purchase_date', dateFilter)

    const allPurchases = purchases || []
    let totalSales = allPurchases.length
    let crmSales = 0
    let crmRevenue = 0

    allPurchases.forEach((purchase) => {
      if (purchase.source === 'casa_one') {
        crmSales++
        crmRevenue += purchase.amount || 0
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
    console.error('Seller impact API error:', err instanceof Error ? err.message : 'unknown')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

