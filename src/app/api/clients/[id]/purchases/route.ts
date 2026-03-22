import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

const PURCHASE_SOURCES = [
  'casa_one',
  'walk_in',
  'instagram',
  'recommendation',
  'existing_client',
  'event',
  'other',
] as const

const createPurchaseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  purchase_date: z.string().optional(),
  source: z.enum(PURCHASE_SOURCES),
})

// POST /api/clients/[id]/purchases - Log purchase
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { id: client_id } = await params

    // Verify client exists and is accessible
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createPurchaseSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        client_id,
        seller_id: user.id,
        amount: parsed.data.amount,
        description: parsed.data.description,
        purchase_date: parsed.data.purchase_date || new Date().toISOString().split('T')[0],
        source: parsed.data.source,
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger auto-updates total_spend and tier
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
