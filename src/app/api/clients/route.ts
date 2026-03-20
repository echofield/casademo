import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import type { ClientTier } from '@/lib/types'
import { createClientBodySchema } from '@/lib/validation/clientForms'

// GET /api/clients - List clients
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const tier = searchParams.get('tier') as ClientTier | null
    const search = searchParams.get('search')
    const seller_id = searchParams.get('seller_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase
      .from('clients')
      .select('*, profiles!clients_seller_id_fkey(full_name)', { count: 'exact' })

    // RLS handles scope, but supervisors can filter by seller
    if (seller_id && user.profile.role === 'supervisor') {
      query = query.eq('seller_id', seller_id)
    }

    if (tier) {
      query = query.eq('tier', tier)
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, count, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      count: count || 0,
      page,
      limit,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

// POST /api/clients - Create client
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const body = await request.json()
    const parsed = createClientBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { seller_id: bodySellerId, ...clientFields } = parsed.data
    let seller_id = user.id

    if (bodySellerId) {
      if (user.profile.role !== 'supervisor') {
        return NextResponse.json(
          { error: 'Only a supervisor can assign a client to another seller' },
          { status: 403 }
        )
      }
      const { data: targetSeller, error: seErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', bodySellerId)
        .eq('role', 'seller')
        .eq('active', true)
        .maybeSingle()

      if (seErr || !targetSeller) {
        return NextResponse.json({ error: 'Invalid or inactive seller' }, { status: 400 })
      }
      seller_id = bodySellerId
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...clientFields,
        seller_id,
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
