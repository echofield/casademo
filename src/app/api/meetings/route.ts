import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import {
  MeetingInsert,
  MeetingWithDetails,
  DEFAULT_BOUTIQUE_LOCATION,
  getWeekBounds,
} from '@/lib/types/meetings'

/**
 * GET /api/meetings
 * List meetings for the authenticated seller (or all for supervisor)
 *
 * Query params:
 * - start: ISO date string (default: start of current week)
 * - end: ISO date string (default: end of current week)
 * - seller_id: UUID (supervisor only, filter by seller)
 * - client_id: UUID (filter by client)
 * - status: meeting status filter
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)

    // Default to current week
    const { start: defaultStart, end: defaultEnd } = getWeekBounds()
    const startParam = searchParams.get('start') || defaultStart.toISOString()
    const endParam = searchParams.get('end') || defaultEnd.toISOString()
    const sellerIdParam = searchParams.get('seller_id')
    const clientIdParam = searchParams.get('client_id')
    const statusParam = searchParams.get('status')

    // Build query with joins
    let query = supabase
      .from('meetings')
      .select(`
        *,
        client:clients(first_name, last_name, tier, phone),
        seller:profiles!meetings_seller_id_fkey(full_name)
      `)
      .gte('start_time', startParam)
      .lte('start_time', endParam)
      .order('start_time', { ascending: true })

    const isSupervisor = user.effectiveRole === 'supervisor'

    if (isSupervisor && sellerIdParam) {
      query = query.eq('seller_id', sellerIdParam)
    } else if (!isSupervisor) {
      query = query.eq('seller_id', user.id)
    }

    // Optional client filter
    if (clientIdParam) {
      query = query.eq('client_id', clientIdParam)
    }

    // Optional status filter
    if (statusParam) {
      query = query.eq('status', statusParam)
    }

    const { data: meetings, error, count } = await query

    if (error) {
      console.error('Error fetching meetings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to MeetingWithDetails format
    const transformed: MeetingWithDetails[] = (meetings || []).map((m) => ({
      id: m.id,
      seller_id: m.seller_id,
      client_id: m.client_id,
      title: m.title,
      description: m.description,
      format: m.format,
      location: m.location,
      start_time: m.start_time,
      end_time: m.end_time,
      all_day: m.all_day,
      status: m.status,
      outcome_notes: m.outcome_notes,
      outcome_purchased: m.outcome_purchased,
      created_at: m.created_at,
      updated_at: m.updated_at,
      client_name: m.client
        ? `${m.client.first_name} ${m.client.last_name}`
        : null,
      client_tier: m.client?.tier || null,
      client_phone: m.client?.phone || null,
      seller_name: m.seller?.full_name || 'Unknown',
    }))

    return NextResponse.json({
      data: transformed,
      count: count || transformed.length,
    })
  } catch (error) {
    console.error('GET /api/meetings error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/meetings
 * Create a new meeting
 *
 * Body: MeetingInsert
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const body: MeetingInsert = await request.json()

    // Validate required fields
    if (!body.title || !body.start_time || !body.end_time || !body.format) {
      return NextResponse.json(
        { error: 'Missing required fields: title, start_time, end_time, format' },
        { status: 400 }
      )
    }

    // Validate time range
    if (new Date(body.end_time) <= new Date(body.start_time)) {
      return NextResponse.json(
        { error: 'end_time must be after start_time' },
        { status: 400 }
      )
    }

    const isEffectiveSupervisor = user.effectiveRole === 'supervisor'
    const sellerId = isEffectiveSupervisor && body.seller_id ? body.seller_id : user.id

    // Auto-fill location for boutique format
    let location = body.location
    if (body.format === 'boutique' && !location) {
      location = DEFAULT_BOUTIQUE_LOCATION
    }

    // Require location for external format
    if (body.format === 'external' && !location) {
      return NextResponse.json(
        { error: 'Location is required for external meetings' },
        { status: 400 }
      )
    }

    // Insert meeting
    const { data: meeting, error: insertError } = await supabase
      .from('meetings')
      .insert({
        seller_id: sellerId,
        client_id: body.client_id || null,
        title: body.title,
        description: body.description || null,
        format: body.format,
        location,
        start_time: body.start_time,
        end_time: body.end_time,
        all_day: body.all_day || false,
        status: 'scheduled',
      })
      .select(`
        *,
        client:clients(first_name, last_name, tier, phone),
        seller:profiles!meetings_seller_id_fkey(full_name)
      `)
      .single()

    if (insertError) {
      console.error('Error creating meeting:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Transform response
    const transformed: MeetingWithDetails = {
      ...meeting,
      client_name: meeting.client
        ? `${meeting.client.first_name} ${meeting.client.last_name}`
        : null,
      client_tier: meeting.client?.tier || null,
      seller_name: meeting.seller?.full_name || 'Unknown',
    }

    return NextResponse.json({ data: transformed }, { status: 201 })
  } catch (error) {
    console.error('POST /api/meetings error:', error)
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
