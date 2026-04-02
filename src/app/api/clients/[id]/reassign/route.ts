import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { requireSupervisor, AuthError } from '@/lib/auth'

const reassignSchema = z.object({
  new_seller_id: z.string().uuid('Invalid seller ID'),
})

// PATCH /api/clients/[id]/reassign - Reassign client to different seller
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSupervisor()
    const supabase = await createClient()
    const { id: client_id } = await params

    const body = await request.json()
    const parsed = reassignSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // Verify new seller exists and is active
    const { data: seller, error: sellerError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', parsed.data.new_seller_id)
      .eq('role', 'seller')
      .eq('active', true)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found or inactive' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('clients')
      .update({ seller_id: parsed.data.new_seller_id } as any)
      .eq('id', client_id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Notify the newly assigned seller
    if (data) {
      const clientName = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'Client'
      await supabase.from('notifications').insert({
        user_id: parsed.data.new_seller_id,
        type: 'new_client_assigned' as any,
        title: `New client: ${clientName}`,
        message: `Reassigned to you by ${user.profile.full_name}`,
        client_id: client_id,
      }).then(({ error: notifErr }) => {
        if (notifErr) console.error('Failed to send reassignment notification:', notifErr.message)
      })
    }

    return NextResponse.json({
      ...data,
      new_seller_name: seller.full_name,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
}

