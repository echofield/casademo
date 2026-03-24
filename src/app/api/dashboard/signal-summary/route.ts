import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor, AuthError } from '@/lib/auth'
import type { ClientSignal } from '@/lib/types'

interface SellerSignalRow {
  seller_id: string
  seller_name: string
  locked: number
  strong: number
  open: number
  low: number
  off: number
  unassessed: number
  total: number
  assessed_pct: number
}

export async function GET() {
  try {
    await requireSupervisor()
    const supabase = await createClient()
    const DEMO_MODE = true

    const { data: allSellers } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'seller')
      .eq('active', true)
      .order('full_name')

    const { data: clientSignals } = await supabase
      .from('clients')
      .select('seller_id, seller_signal')
      .eq('is_demo', DEMO_MODE)

    type SignalCounts = Record<ClientSignal | 'null', number>
    const sellerMap: Record<string, { name: string; signals: SignalCounts; total: number }> = {}

    ;(allSellers || []).forEach((seller) => {
      sellerMap[seller.id] = {
        name: seller.full_name,
        signals: { very_hot: 0, hot: 0, warm: 0, cold: 0, lost: 0, null: 0 },
        total: 0,
      }
    })

    ;(clientSignals || []).forEach((c) => {
      if (sellerMap[c.seller_id]) {
        const key = (c.seller_signal || 'null') as ClientSignal | 'null'
        sellerMap[c.seller_id].signals[key]++
        sellerMap[c.seller_id].total++
      }
    })

    const by_seller: SellerSignalRow[] = Object.entries(sellerMap)
      .map(([id, data]) => {
        const assessed = data.total - data.signals.null
        return {
          seller_id: id,
          seller_name: data.name,
          locked: data.signals.very_hot,
          strong: data.signals.hot,
          open: data.signals.warm,
          low: data.signals.cold,
          off: data.signals.lost,
          unassessed: data.signals.null,
          total: data.total,
          assessed_pct: data.total > 0 ? Math.round((assessed / data.total) * 100) : 0,
        }
      })
      .filter(s => s.total > 0)
      .sort((a, b) => b.total - a.total)

    const totals = by_seller.reduce(
      (acc, s) => ({
        locked: acc.locked + s.locked,
        strong: acc.strong + s.strong,
        open: acc.open + s.open,
        low: acc.low + s.low,
        off: acc.off + s.off,
        unassessed: acc.unassessed + s.unassessed,
        total: acc.total + s.total,
        assessed_pct: 0,
      }),
      { locked: 0, strong: 0, open: 0, low: 0, off: 0, unassessed: 0, total: 0, assessed_pct: 0 }
    )
    const totalAssessed = totals.total - totals.unassessed
    totals.assessed_pct = totals.total > 0 ? Math.round((totalAssessed / totals.total) * 100) : 0

    // Weekly changes (signals set or changed this week)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()

    const { data: recentChanges } = await supabase
      .from('clients')
      .select('seller_signal, signal_updated_at')
      .eq('is_demo', DEMO_MODE)
      .gte('signal_updated_at', weekAgoStr)

    const changes_this_week = {
      newly_assessed: (recentChanges || []).length,
      upgraded: 0,
      downgraded: 0,
    }

    return NextResponse.json({ by_seller, totals, changes_this_week })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
