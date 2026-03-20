import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireAuth, AuthError } from '@/lib/auth'
import type { ContactChannel } from '@/lib/types'

const VALID_CHANNELS: ContactChannel[] = ['whatsapp', 'sms', 'phone', 'email', 'in_store', 'other']

const createContactSchema = z.object({
  channel: z.enum(VALID_CHANNELS as [ContactChannel, ...ContactChannel[]]),
  comment: z.string().optional().nullable(),
  contact_date: z.string().datetime().optional(),
})

// POST /api/clients/[id]/contacts - Log interaction
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
    const parsed = createContactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('contacts')
      .insert({
        client_id,
        seller_id: user.id,
        channel: parsed.data.channel as string,
        comment: parsed.data.comment,
        contact_date: parsed.data.contact_date || new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger auto-updates last_contact_date and next_recontact_date
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
