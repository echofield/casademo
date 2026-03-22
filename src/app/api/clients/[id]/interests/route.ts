import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'

const singleInterestSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  value: z.string().min(1, 'Value is required'),
  detail: z.string().optional().nullable(),
})

const bulkInterestsSchema = z.object({
  interests: z.array(z.object({
    category: z.string().min(1),
    value: z.string().min(1),
    detail: z.string().optional().nullable(),
  })),
})

// POST /api/clients/[id]/interests - Add interest(s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth()
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

    // Check if bulk format
    const bulkParsed = bulkInterestsSchema.safeParse(body)
    if (bulkParsed.success) {
      const inserts = bulkParsed.data.interests.map(i => ({
        client_id,
        category: i.category,
        value: i.value,
        detail: i.detail || null,
      }))

      const { data, error } = await supabase
        .from('client_interests')
        .insert(inserts as any)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data, { status: 201 })
    }

    // Single interest format
    const parsed = singleInterestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('client_interests')
      .insert({
        client_id,
        category: parsed.data.category,
        value: parsed.data.value,
        detail: parsed.data.detail,
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
