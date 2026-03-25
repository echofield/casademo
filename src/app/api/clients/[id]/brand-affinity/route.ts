import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

const brandAffinitySchema = z.object({
  familiarity: z.enum(['new', 'aware', 'regular', 'loyal', 'vip']).nullable().optional(),
  sensitivity: z.enum(['price_sensitive', 'value_driven', 'exclusivity_driven']).nullable().optional(),
  purchase_behavior: z.enum(['occasional', 'seasonal', 'frequent', 'collector']).nullable().optional(),
  contact_preference: z.enum(['passive', 'reactive', 'proactive']).nullable().optional(),
  channel: z.enum(['in_store', 'online', 'mixed']).nullable().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id: client_id } = await params

    const { data, error } = await supabase
      .from('client_brand_affinity')
      .select('*')
      .eq('client_id', client_id)
      .maybeSingle()

    if (error) {
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

// PUT — upsert only, no delete
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id: client_id } = await params

    const { data: client, error: clientErr } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientErr || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = brandAffinitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const values = {
      client_id,
      familiarity: parsed.data.familiarity ?? null,
      sensitivity: parsed.data.sensitivity ?? null,
      purchase_behavior: parsed.data.purchase_behavior ?? null,
      contact_preference: parsed.data.contact_preference ?? null,
      channel: parsed.data.channel ?? null,
    }

    const { data, error } = await supabase
      .from('client_brand_affinity')
      .upsert(values as any, { onConflict: 'client_id' })
      .select()
      .single()

    if (error) {
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
