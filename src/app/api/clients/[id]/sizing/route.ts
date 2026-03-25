import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { getSizeConfig, SIZE_ITEM_TYPES } from '@/lib/config/sizeSystem'

const sizingSchema = z.object({
  category: z.string().min(1),
  size: z.string().min(1),
  size_system: z.enum(['EU', 'US', 'UK', 'INTL']).optional(),
  fit_preference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// POST /api/clients/[id]/sizing — upsert a size entry (one per item type)
export async function POST(
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
    const parsed = sizingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const category = parsed.data.category.toLowerCase()
    const config = getSizeConfig(category)

    // Auto-assign size_system from config if not provided
    const size_system = parsed.data.size_system ?? config?.system ?? 'INTL'

    const { data, error } = await supabase
      .from('client_sizing')
      .upsert(
        {
          client_id,
          category,
          size: parsed.data.size,
          size_system,
          fit_preference: parsed.data.fit_preference ?? null,
          notes: parsed.data.notes ?? null,
        } as any,
        { onConflict: 'client_id,category' }
      )
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

// DELETE /api/clients/[id]/sizing — remove a size entry by category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
    const supabase = await createClient()
    const { id: client_id } = await params

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('client_sizing')
      .delete()
      .eq('client_id', client_id)
      .eq('category', category.toLowerCase())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
