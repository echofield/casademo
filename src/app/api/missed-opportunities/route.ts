import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoMissedOpportunities } from '@/lib/demo/presentation-data'

// GET /api/missed-opportunities?client_id=xxx
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('client_id')

    if (isDemoMode) {
      const data = getDemoMissedOpportunities(clientId ?? undefined)
      return NextResponse.json({ data })
    }

    const supabase = await createClient()

    let query = supabase
      .from('missed_opportunities')
      .select('*')
      .order('date', { ascending: false })
      .limit(50)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? [] })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

// POST /api/missed-opportunities
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()

    const {
      date,
      seller_id,
      seller_name,
      client_id,
      result,
      missed_type,
      description,
      cause,
      impact,
      recommended_action,
    } = body

    if (!seller_name || !result || !missed_type) {
      return NextResponse.json(
        { error: 'seller_name, result, and missed_type are required' },
        { status: 400 }
      )
    }

    if (!['Good', 'Missed'].includes(result)) {
      return NextResponse.json({ error: 'result must be Good or Missed' }, { status: 400 })
    }

    if (isDemoMode) {
      const mock = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        date: date ?? new Date().toISOString().split('T')[0],
        seller_id: seller_id ?? null,
        seller_name,
        client_id: client_id ?? null,
        result,
        missed_type,
        description: description ?? '',
        cause: cause ?? '',
        impact: impact ?? '',
        recommended_action: recommended_action ?? '',
      }
      return NextResponse.json({ data: mock }, { status: 201 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('missed_opportunities')
      .insert({
        date: date ?? new Date().toISOString().split('T')[0],
        seller_id: seller_id ?? null,
        seller_name,
        client_id: client_id ?? null,
        result,
        missed_type,
        description: description ?? '',
        cause: cause ?? '',
        impact: impact ?? '',
        recommended_action: recommended_action ?? '',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
