import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

export const PURCHASE_SOURCES = [
  'casa_one',
  'walk_in',
  'instagram',
  'recommendation',
  'existing_client',
  'event',
  'other',
] as const

const PRODUCT_CATEGORY_VALUES = [
  'jacket', 'trousers', 'shirt', 'knitwear', 'shoes', 'accessories', 'other',
] as const

const SIZE_TYPE_VALUES = ['letter', 'number', 'shoe'] as const

const createPurchaseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().nullable(),
  purchase_date: z.string().optional(),
  source: z.enum(PURCHASE_SOURCES).optional().default('other'),
  product_name: z.string().optional().nullable().transform((v) => v?.trim() || null),
  product_category: z.enum(PRODUCT_CATEGORY_VALUES).optional().nullable(),
  size: z.string().optional().nullable().transform((v) => v?.trim() || null),
  size_type: z.enum(SIZE_TYPE_VALUES).optional().nullable(),
  is_gift: z.boolean().optional().default(false),
  gift_recipient: z.string().optional().nullable().transform((v) => v?.trim() || null),
})

type PostPurchasesDeps = {
  createClient: typeof createClient
  requireAuth: typeof requireAuth
}

export function createPostPurchasesHandler(
  deps: PostPurchasesDeps = { createClient, requireAuth }
) {
  return async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const user = await deps.requireAuth()
      const supabase = await deps.createClient()
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
          source: parsed.data.source || 'other',
          product_name: parsed.data.product_name ?? null,
          product_category: parsed.data.product_category ?? null,
          size: parsed.data.size ?? null,
          size_type: parsed.data.size_type ?? null,
          is_gift: parsed.data.is_gift ?? false,
          gift_recipient: parsed.data.gift_recipient ?? null,
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
}
