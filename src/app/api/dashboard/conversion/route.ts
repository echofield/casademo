import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { PurchaseSource, PURCHASE_SOURCES } from '@/lib/types'

interface SourceBreakdown {
  source: string
  count: number
  revenue: number
  avg_basket: number
  pct_of_total: number
}

interface SellerBreakdown {
  seller_id: string
  seller_name: string
  total_sales: number
  crm_sales: number
  crm_pct: number
  crm_revenue: number
}

interface SignalBreakdown {
  signal: string | null
  client_count: number
  sales_count: number
  conversion_pct: number
  avg_basket: number
}

interface ConversionTotals {
  total_revenue: number
  crm_revenue: number
  total_sales: number
  crm_sales: number
  conversion_rate: number
  avg_crm_basket: number
}

interface ConversionResponse {
  period: 'week' | 'month' | 'all'
  by_source: SourceBreakdown[]
  by_seller: SellerBreakdown[]
  by_signal: SignalBreakdown[]
  totals: ConversionTotals
}

// GET /api/dashboard/conversion?period=month
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Only supervisors can see conversion metrics
    if (user.profile.role !== 'supervisor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') || 'month') as 'week' | 'month' | 'all'

    // Calculate date filter
    let dateFilter: string | null = null
    const now = new Date()
    if (period === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      dateFilter = weekAgo.toISOString().split('T')[0]
    } else if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      dateFilter = monthStart.toISOString().split('T')[0]
    }

    // Parallel queries for efficiency
    const [
      purchasesResult,
      clientSignalsResult,
      sellersResult,
    ] = await Promise.all([
      // All purchases (with optional date filter)
      dateFilter
        ? supabase
            .from('purchases')
            .select('id, amount, source, seller_id, client_id')
            .gte('purchase_date', dateFilter)
        : supabase
            .from('purchases')
            .select('id, amount, source, seller_id, client_id'),
      // Client signals for conversion by signal
      supabase
        .from('clients')
        .select('id, seller_signal'),
      // Sellers for name lookup
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'seller')
        .eq('active', true),
    ])

    const purchases = purchasesResult.data || []
    const clients = clientSignalsResult.data || []
    const sellers = sellersResult.data || []

    // Build seller name lookup
    const sellerNameMap: Record<string, string> = {}
    sellers.forEach(s => {
      sellerNameMap[s.id] = s.full_name
    })

    // Build client signal lookup
    const clientSignalMap: Record<string, string | null> = {}
    clients.forEach(c => {
      clientSignalMap[c.id] = (c as any).seller_signal || null
    })

    // Calculate totals
    let totalRevenue = 0
    let crmRevenue = 0
    let totalSales = purchases.length
    let crmSales = 0

    // By source breakdown
    const sourceMap: Record<string, { count: number; revenue: number }> = {}
    PURCHASE_SOURCES.forEach(s => {
      sourceMap[s.value] = { count: 0, revenue: 0 }
    })

    // By seller breakdown
    const sellerMap: Record<string, { total_sales: number; crm_sales: number; crm_revenue: number }> = {}
    sellers.forEach(s => {
      sellerMap[s.id] = { total_sales: 0, crm_sales: 0, crm_revenue: 0 }
    })

    // By signal breakdown - track clients and their purchases
    const signalClientMap: Record<string, Set<string>> = {
      'very_hot': new Set(),
      'hot': new Set(),
      'warm': new Set(),
      'cold': new Set(),
      'lost': new Set(),
      'null': new Set(),
    }
    const signalPurchaseMap: Record<string, { count: number; revenue: number }> = {
      'very_hot': { count: 0, revenue: 0 },
      'hot': { count: 0, revenue: 0 },
      'warm': { count: 0, revenue: 0 },
      'cold': { count: 0, revenue: 0 },
      'lost': { count: 0, revenue: 0 },
      'null': { count: 0, revenue: 0 },
    }

    // Process purchases
    purchases.forEach(p => {
      const amount = p.amount || 0
      const source = (p.source || 'walk_in') as PurchaseSource
      const sellerId = p.seller_id
      const clientId = p.client_id
      const signal = clientSignalMap[clientId] || null
      const signalKey = signal || 'null'

      totalRevenue += amount

      // Source breakdown
      if (sourceMap[source]) {
        sourceMap[source].count++
        sourceMap[source].revenue += amount
      }

      // CRM tracking
      if (source === 'casa_one') {
        crmRevenue += amount
        crmSales++
      }

      // Seller breakdown
      if (sellerMap[sellerId]) {
        sellerMap[sellerId].total_sales++
        if (source === 'casa_one') {
          sellerMap[sellerId].crm_sales++
          sellerMap[sellerId].crm_revenue += amount
        }
      }

      // Signal breakdown
      if (signalPurchaseMap[signalKey]) {
        signalPurchaseMap[signalKey].count++
        signalPurchaseMap[signalKey].revenue += amount
        signalClientMap[signalKey].add(clientId)
      }
    })

    // Count all clients by signal (not just those with purchases)
    const signalClientCounts: Record<string, number> = {
      'very_hot': 0,
      'hot': 0,
      'warm': 0,
      'cold': 0,
      'lost': 0,
      'null': 0,
    }
    clients.forEach(c => {
      const signal = (c as any).seller_signal || null
      const signalKey = signal || 'null'
      if (signalClientCounts[signalKey] !== undefined) {
        signalClientCounts[signalKey]++
      }
    })

    // Build response
    const by_source: SourceBreakdown[] = Object.entries(sourceMap)
      .map(([source, data]) => ({
        source,
        count: data.count,
        revenue: data.revenue,
        avg_basket: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
        pct_of_total: totalSales > 0 ? Math.round((data.count / totalSales) * 100) : 0,
      }))
      .filter(s => s.count > 0)
      .sort((a, b) => b.revenue - a.revenue)

    const by_seller: SellerBreakdown[] = Object.entries(sellerMap)
      .map(([seller_id, data]) => ({
        seller_id,
        seller_name: sellerNameMap[seller_id] || 'Unknown',
        total_sales: data.total_sales,
        crm_sales: data.crm_sales,
        crm_pct: data.total_sales > 0 ? Math.round((data.crm_sales / data.total_sales) * 100) : 0,
        crm_revenue: data.crm_revenue,
      }))
      .filter(s => s.total_sales > 0)
      .sort((a, b) => b.crm_revenue - a.crm_revenue)

    const signalLabels: Record<string, string> = {
      'very_hot': 'Locked',
      'hot': 'Strong',
      'warm': 'Open',
      'cold': 'Low',
      'lost': 'Off',
      'null': 'Not assessed',
    }

    const by_signal: SignalBreakdown[] = Object.entries(signalPurchaseMap)
      .map(([signal, data]) => ({
        signal: signal === 'null' ? null : signal,
        client_count: signalClientCounts[signal] || 0,
        sales_count: data.count,
        conversion_pct: signalClientCounts[signal] > 0
          ? Math.round((signalClientMap[signal].size / signalClientCounts[signal]) * 100)
          : 0,
        avg_basket: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
      }))
      .sort((a, b) => b.conversion_pct - a.conversion_pct)

    const totals: ConversionTotals = {
      total_revenue: totalRevenue,
      crm_revenue: crmRevenue,
      total_sales: totalSales,
      crm_sales: crmSales,
      conversion_rate: totalSales > 0 ? Math.round((crmSales / totalSales) * 100) : 0,
      avg_crm_basket: crmSales > 0 ? Math.round(crmRevenue / crmSales) : 0,
    }

    const response: ConversionResponse = {
      period,
      by_source,
      by_seller,
      by_signal,
      totals,
    }

    return NextResponse.json(response)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    console.error('Conversion API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
