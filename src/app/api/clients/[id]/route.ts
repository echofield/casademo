import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import type { Client360, InterestItem, ContactHistoryItem, PurchaseHistoryItem } from '@/lib/types'
import { updateClientBodySchema } from '@/lib/validation/clientForms'

// GET /api/clients/[id] - Client 360 detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from('client_360')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Type the JSON arrays
    const client360: Client360 = {
      ...data,
      interests: data.interests as InterestItem[] | null,
      contact_history: data.contact_history as ContactHistoryItem[] | null,
      purchase_history: data.purchase_history as PurchaseHistoryItem[] | null,
    }

    return NextResponse.json(client360)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

// PATCH /api/clients/[id] - Update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const body = await request.json()
    if (body && typeof body === 'object' && 'seller_id' in body) {
      return NextResponse.json(
        { error: 'Use PATCH /api/clients/[id]/reassign to change seller (supervisor only)' },
        { status: 400 }
      )
    }

    const parsed = updateClientBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('clients')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (user.profile.role !== 'supervisor' && existing.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit clients assigned to you' },
        { status: 403 }
      )
    }

    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('clients')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
