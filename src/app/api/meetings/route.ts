import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { MeetingInsert, MeetingWithDetails, DEFAULT_BOUTIQUE_LOCATION, getWeekBounds } from '@/lib/types/meetings'
import { isDemoMode } from '@/lib/demo/config'
import { getDemoMeetings } from '@/lib/demo/presentation-data'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)

    const { start: defaultStart, end: defaultEnd } = getWeekBounds()
    const startParam = searchParams.get('start') || defaultStart.toISOString()
    const endParam = searchParams.get('end') || defaultEnd.toISOString()
    const sellerIdParam = searchParams.get('seller_id')
    const clientIdParam = searchParams.get('client_id')
    const statusParam = searchParams.get('status')

    if (isDemoMode) {
      const isSupervisor = user.effectiveRole === 'supervisor'
      const effectiveSellerId = isSupervisor ? sellerIdParam || user.id : user.id
      const meetings = getDemoMeetings(isSupervisor ? 'supervisor' : 'seller', effectiveSellerId)
        .filter((meeting) => new Date(meeting.start_time) >= new Date(startParam))
        .filter((meeting) => new Date(meeting.start_time) <= new Date(endParam))
        .filter((meeting) => (clientIdParam ? meeting.client_id === clientIdParam : true))
        .filter((meeting) => (statusParam ? meeting.status === statusParam : true))
        .filter((meeting) => (isSupervisor || meeting.seller_id === user.id))

      return NextResponse.json({ data: meetings, count: meetings.length })
    }

    const supabase = await createClient()
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

    if (clientIdParam) {
      query = query.eq('client_id', clientIdParam)
    }

    if (statusParam) {
      query = query.eq('status', statusParam)
    }

    const { data: meetings, error, count } = await query

    if (error) {
      console.error('Error fetching meetings:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformed: MeetingWithDetails[] = (meetings || []).map((meeting) => ({
      id: meeting.id,
      seller_id: meeting.seller_id,
      client_id: meeting.client_id,
      title: meeting.title,
      description: meeting.description,
      format: meeting.format,
      location: meeting.location,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      all_day: meeting.all_day,
      status: meeting.status,
      outcome_notes: meeting.outcome_notes,
      outcome_purchased: meeting.outcome_purchased,
      created_at: meeting.created_at,
      updated_at: meeting.updated_at,
      client_name: meeting.client ? `${meeting.client.first_name} ${meeting.client.last_name}` : null,
      client_tier: meeting.client?.tier || null,
      client_phone: meeting.client?.phone || null,
      seller_name: meeting.seller?.full_name || 'Unknown',
    }))

    return NextResponse.json({ data: transformed, count: count || transformed.length })
  } catch (error) {
    console.error('GET /api/meetings error:', error instanceof Error ? error.message : 'unknown')
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (isDemoMode) {
      return NextResponse.json({ error: 'Presentation mode is read-only for meetings' }, { status: 403 })
    }

    const supabase = await createClient()
    const body: MeetingInsert = await request.json()

    if (!body.title || !body.start_time || !body.end_time || !body.format) {
      return NextResponse.json({ error: 'Missing required fields: title, start_time, end_time, format' }, { status: 400 })
    }

    if (new Date(body.end_time) <= new Date(body.start_time)) {
      return NextResponse.json({ error: 'end_time must be after start_time' }, { status: 400 })
    }

    const isEffectiveSupervisor = user.effectiveRole === 'supervisor'
    const sellerId = isEffectiveSupervisor && body.seller_id ? body.seller_id : user.id

    let location = body.location
    if (body.format === 'boutique' && !location) {
      location = DEFAULT_BOUTIQUE_LOCATION
    }

    if (body.format === 'external' && !location) {
      return NextResponse.json({ error: 'Location is required for external meetings' }, { status: 400 })
    }

    const { data: existingMeeting } = await supabase
      .from('meetings')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('start_time', body.start_time)
      .eq('status', 'scheduled')
      .maybeSingle()

    if (existingMeeting) {
      return NextResponse.json({ error: 'A meeting already exists at this time', duplicate: true }, { status: 409 })
    }

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
      console.error('Error creating meeting:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const transformed: MeetingWithDetails = {
      ...meeting,
      client_name: meeting.client ? `${meeting.client.first_name} ${meeting.client.last_name}` : null,
      client_tier: meeting.client?.tier || null,
      seller_name: meeting.seller?.full_name || 'Unknown',
    }

    return NextResponse.json({ data: transformed }, { status: 201 })
  } catch (error) {
    console.error('POST /api/meetings error:', error instanceof Error ? error.message : 'unknown')
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

