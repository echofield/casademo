import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor, AuthError } from '@/lib/auth'
import type { DashboardMetrics, ClientTier } from '@/lib/types'

// GET /api/dashboard - Supervisor dashboard metrics
export async function GET() {
  try {
    await requireSupervisor()
    const supabase = await createClient()


    // Get clients by tier
    const { data: clientsByTier, error: tierError } = await supabase
      .from('clients')
      .select('tier')

    if (tierError) {
      return NextResponse.json({ error: tierError.message }, { status: 500 })
    }

    const tierCounts: Record<ClientTier, number> = {
      rainbow: 0,
      optimisto: 0,
      kaizen: 0,
      idealiste: 0,
      diplomatico: 0,
      grand_prix: 0,
    }

    clientsByTier?.forEach((c) => {
      tierCounts[c.tier as ClientTier]++
    })

    // Get contacts this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { count: contactsThisWeek, error: contactsError } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .gte('contact_date', weekAgo.toISOString())

    if (contactsError) {
      return NextResponse.json({ error: contactsError.message }, { status: 500 })
    }

    // Get overdue by seller
    const { data: overdueData, error: overdueError } = await supabase
      .from('recontact_queue')
      .select('seller_id, seller_name')
      .gt('days_overdue', 0)

    if (overdueError) {
      return NextResponse.json({ error: overdueError.message }, { status: 500 })
    }

    const overdueMap = new Map<string, { seller_name: string; count: number }>()
    overdueData?.forEach((item) => {
      const existing = overdueMap.get(item.seller_id)
      if (existing) {
        existing.count++
      } else {
        overdueMap.set(item.seller_id, {
          seller_name: item.seller_name,
          count: 1,
        })
      }
    })

    const overdue_by_seller = Array.from(overdueMap.entries()).map(
      ([seller_id, { seller_name, count }]) => ({
        seller_id,
        seller_name,
        overdue_count: count,
      })
    )

    // Get seller activity (contacts per seller this week)
    const { data: sellerActivity } = await supabase
      .from('contacts')
      .select('seller_id, profiles!contacts_seller_id_fkey(full_name)')
      .gte('contact_date', weekAgo.toISOString())

    const activityMap = new Map<string, { seller_name: string; contacts_this_week: number }>()
    sellerActivity?.forEach((item) => {
      const existing = activityMap.get(item.seller_id)
      // @ts-expect-error - profiles is joined but TS doesn't know the shape
      const sellerName = item.profiles?.full_name || 'Unknown'
      if (existing) {
        existing.contacts_this_week++
      } else {
        activityMap.set(item.seller_id, {
          seller_name: sellerName,
          contacts_this_week: 1,
        })
      }
    })

    // Get all sellers to show zeros too
    const { data: allSellers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'seller')
      .eq('active', true)

    const seller_activity = (allSellers || []).map((seller) => {
      const activity = activityMap.get(seller.id)
      const overdue = overdue_by_seller.find((o) => o.seller_id === seller.id)
      return {
        seller_id: seller.id,
        seller_name: seller.full_name,
        contacts_this_week: activity?.contacts_this_week || 0,
        overdue_count: overdue?.overdue_count || 0,
      }
    }).sort((a, b) => b.contacts_this_week - a.contacts_this_week)

    const metrics: DashboardMetrics = {
      clients_by_tier: tierCounts,
      contacts_this_week: contactsThisWeek || 0,
      overdue_by_seller,
      total_clients: clientsByTier?.length || 0,
      total_overdue: overdueData?.length || 0,
    }

    return NextResponse.json({
      ...metrics,
      seller_activity,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
