import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { MeetingUpdate, MeetingWithDetails } from '@/lib/types/meetings'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/meetings/[id]
 * Get a single meeting with full details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select(`
        *,
        client:clients(first_name, last_name, tier, email, phone),
        seller:profiles!meetings_seller_id_fkey(full_name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const isSupervisor = user.effectiveRole === 'supervisor'
    if (!isSupervisor && meeting.seller_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Transform response
    const transformed: MeetingWithDetails = {
      ...meeting,
      client_name: meeting.client
        ? `${meeting.client.first_name} ${meeting.client.last_name}`
        : null,
      client_tier: meeting.client?.tier || null,
      client_phone: meeting.client?.phone || null,
      seller_name: meeting.seller?.full_name || 'Unknown',
    }

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('GET /api/meetings/[id] error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/meetings/[id]
 * Update a meeting (status, time, notes, outcome)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    const body: MeetingUpdate = await request.json()

    // First, check if meeting exists and user has access
    const { data: existing, error: fetchError } = await supabase
      .from('meetings')
      .select('seller_id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const isSupervisor = user.effectiveRole === 'supervisor'
    if (!isSupervisor && existing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate time range if both are provided
    if (body.start_time && body.end_time) {
      if (new Date(body.end_time) <= new Date(body.start_time)) {
        return NextResponse.json(
          { error: 'end_time must be after start_time' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.format !== undefined) updateData.format = body.format
    if (body.location !== undefined) updateData.location = body.location
    if (body.start_time !== undefined) updateData.start_time = body.start_time
    if (body.end_time !== undefined) updateData.end_time = body.end_time
    if (body.all_day !== undefined) updateData.all_day = body.all_day
    if (body.status !== undefined) updateData.status = body.status
    if (body.outcome_notes !== undefined) updateData.outcome_notes = body.outcome_notes
    if (body.outcome_purchased !== undefined) updateData.outcome_purchased = body.outcome_purchased

    // Update meeting
    const { data: meeting, error: updateError } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(first_name, last_name, tier, phone),
        seller:profiles!meetings_seller_id_fkey(full_name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating meeting:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Transform response
    const transformed: MeetingWithDetails = {
      ...meeting,
      client_name: meeting.client
        ? `${meeting.client.first_name} ${meeting.client.last_name}`
        : null,
      client_tier: meeting.client?.tier || null,
      client_phone: meeting.client?.phone || null,
      seller_name: meeting.seller?.full_name || 'Unknown',
    }

    return NextResponse.json({ data: transformed })
  } catch (error) {
    console.error('PATCH /api/meetings/[id] error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/meetings/[id]
 * Soft delete - sets status to 'cancelled'
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()
    const { id } = await params

    // First, check if meeting exists and user has access
    const { data: existing, error: fetchError } = await supabase
      .from('meetings')
      .select('seller_id, status')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const isSupervisor = user.effectiveRole === 'supervisor'
    if (!isSupervisor && existing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Don't cancel already cancelled meetings
    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'Meeting is already cancelled' }, { status: 400 })
    }

    // Soft delete - set status to cancelled
    const { error: updateError } = await supabase
      .from('meetings')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling meeting:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Meeting cancelled' })
  } catch (error) {
    console.error('DELETE /api/meetings/[id] error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
