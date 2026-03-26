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
      .select('id, first_name, last_name, seller_id, tier')
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

    const isMarkDone =
      parsed.data.channel === 'other' &&
      (parsed.data.comment || '').trim().toLowerCase() === 'follow-up completed'

    // Idempotency for "Mark as done": one completion log per seller/client/day.
    if (isMarkDone) {
      const now = new Date()
      const startOfDayUtc = new Date(now)
      startOfDayUtc.setUTCHours(0, 0, 0, 0)
      const endOfDayUtc = new Date(startOfDayUtc)
      endOfDayUtc.setUTCDate(endOfDayUtc.getUTCDate() + 1)

      const { data: existingDone } = await supabase
        .from('contacts')
        .select('id')
        .eq('client_id', client_id)
        .eq('seller_id', user.id)
        .eq('channel', 'other')
        .eq('comment', 'Follow-up completed')
        .gte('contact_date', startOfDayUtc.toISOString())
        .lt('contact_date', endOfDayUtc.toISOString())
        .limit(1)
        .maybeSingle()

      if (existingDone) {
        const { data: updatedClient } = await supabase
          .from('clients')
          .select('id, last_contact_date, next_recontact_date')
          .eq('id', client_id)
          .single()

        return NextResponse.json(
          { already_done: true, client: updatedClient },
          { status: 200 }
        )
      }
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

    // Notify supervisors that a seller contacted a client (operational visibility)
    const { data: supervisors } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'supervisor')
      .eq('active', true)

    const supervisorRows = (supervisors || []).filter((s) => s.id !== user.id)
    if (supervisorRows.length > 0) {
      const channelLabel = parsed.data.channel.replace('_', ' ')
      const tierLabel = String(client.tier || '').replace('_', ' ').toUpperCase()
      const notificationRows = supervisorRows.map((s) => ({
        user_id: s.id,
        type: 'manual' as const,
        title: `${user.profile.full_name} contacted ${client.first_name} ${client.last_name}`,
        message: `${channelLabel} · ${tierLabel}`,
        client_id,
      }))

      await supabase.from('notifications').insert(notificationRows)
    }

    // Trigger auto-updates last_contact_date and next_recontact_date
    // Return updated client dates so UIs can react immediately.
    const { data: updatedClient } = await supabase
      .from('clients')
      .select('id, last_contact_date, next_recontact_date')
      .eq('id', client_id)
      .single()

    return NextResponse.json({ contact: data, client: updatedClient }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}
